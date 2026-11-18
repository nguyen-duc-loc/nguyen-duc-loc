// A small PNG reader, resizer, and writer (spec 0010), so `pnpm refresh` can shrink outside badge images before
// they are embedded in an SVG, with no image library. Pure: bytes in, bytes out. Reads 8 and 16 bit, non interlaced
// gray, RGB, palette, gray with alpha, and RGBA images. Anything else throws `ValidationError`.

import { deflateSync, inflateSync } from "node:zlib";
import { ValidationError } from "./sources/http.ts";

const SIGNATURE = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
/** Larger images are refused, so a hostile file can't make refresh allocate gigabytes. */
const MAX_SIDE = 4096;

/** Straight (not premultiplied) 8 bit RGBA, row by row. */
export type Rgba = { readonly width: number; readonly height: number; readonly pixels: Uint8Array };

type Header = {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly colorType: number;
  readonly interlace: number;
};

const CHANNELS: { readonly [colorType: number]: number } = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Undoes the per row filters in place; returns the raw rows, `stride` bytes each. */
function unfilter(data: Uint8Array, height: number, stride: number, bpp: number): Uint8Array {
  if (data.length < height * (stride + 1)) throw new ValidationError("png: image data is too short");
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const row = y * stride;
    const prev = row - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[prev + x] : 0;
      const c = x >= bpp && y > 0 ? out[prev + x - bpp] : 0;
      const raw = data[src + x];
      const predictor =
        filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? (a + b) >> 1 : paeth(a, b, c);
      if (filter > 4) throw new ValidationError(`png: unknown filter ${filter}`);
      out[row + x] = (raw + predictor) & 0xff;
    }
  }
  return out;
}

/** Decodes a PNG to straight 8 bit RGBA. */
export function decodePng(bytes: Uint8Array): Rgba {
  if (bytes.length < 8 || SIGNATURE.some((value, i) => bytes[i] !== value)) {
    throw new ValidationError("png: not a PNG file");
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let header: Header | undefined;
  let palette: Uint8Array = new Uint8Array(0);
  let transparency: Uint8Array = new Uint8Array(0);
  const parts: Uint8Array[] = [];
  for (let offset = 8; offset + 8 <= bytes.length; ) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (body.length !== length) throw new ValidationError("png: truncated chunk");
    if (type === "IHDR") {
      header = {
        width: view.getUint32(offset + 8),
        height: view.getUint32(offset + 12),
        depth: body[8],
        colorType: body[9],
        interlace: body[12],
      };
    } else if (type === "PLTE") {
      palette = body;
    } else if (type === "tRNS") {
      transparency = body;
    } else if (type === "IDAT") {
      parts.push(body);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  if (header === undefined) throw new ValidationError("png: no IHDR chunk");
  const { width, height, depth, colorType, interlace } = header;
  const channels = CHANNELS[colorType];
  if (channels === undefined || (depth !== 8 && depth !== 16) || (colorType === 3 && depth !== 8)) {
    throw new ValidationError(`png: unsupported color type ${colorType} at ${depth} bits`);
  }
  if (interlace !== 0) throw new ValidationError("png: interlaced images are not supported");
  if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE) {
    throw new ValidationError(`png: ${width} × ${height} is out of range`);
  }

  const bytesPerSample = depth / 8;
  const bpp = channels * bytesPerSample;
  const rows = unfilter(inflateSync(Buffer.concat(parts)), height, width * bpp, bpp);
  const pixels = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    // The high byte of each sample is enough for 16 bit images.
    const sample = (k: number): number => rows[i * bpp + k * bytesPerSample];
    const out = i * 4;
    if (colorType === 3) {
      const index = sample(0);
      pixels.set(palette.subarray(index * 3, index * 3 + 3), out);
      pixels[out + 3] = index < transparency.length ? transparency[index] : 255;
    } else if (colorType === 0 || colorType === 4) {
      pixels.fill(sample(0), out, out + 3);
      pixels[out + 3] = colorType === 4 ? sample(1) : 255;
    } else {
      pixels.set([sample(0), sample(1), sample(2)], out);
      pixels[out + 3] = colorType === 6 ? sample(3) : 255;
    }
  }
  return { width, height, pixels };
}

/**
 * Shrinks an image to fit inside `size` × `size`, centered on a transparent square. Each output pixel averages the
 * source pixels it covers, weighted by alpha, so edges don't pick up dark fringes. Never enlarges.
 */
export function fitSquare({ width, height, pixels }: Rgba, size: number): Rgba {
  const scale = Math.min(1, size / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  const side = Math.max(w, h);
  const ox = Math.floor((side - w) / 2);
  const oy = Math.floor((side - h) / 2);
  const out = new Uint8Array(side * side * 4);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor((y * height) / h);
    const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / h));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * width) / w);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / w));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const i = (sy * width + sx) * 4;
          const alpha = pixels[i + 3];
          r += pixels[i] * alpha;
          g += pixels[i + 1] * alpha;
          b += pixels[i + 2] * alpha;
          a += alpha;
        }
      }
      const o = ((y + oy) * side + x + ox) * 4;
      const count = (y1 - y0) * (x1 - x0);
      if (a > 0) out.set([Math.round(r / a), Math.round(g / a), Math.round(b / a)], o);
      out[o + 3] = Math.round(a / count);
    }
  }
  return { width: side, height: side, pixels: out };
}

function chunk(type: string, body: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + body.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, body.length);
  out.set(Buffer.from(type, "latin1"), 4);
  out.set(body, 8);
  view.setUint32(8 + body.length, crc32(out.subarray(4, 8 + body.length)));
  return out;
}

/** Encodes straight 8 bit RGBA as a PNG, with a Paeth filter on every row. Same input, same bytes. */
export function encodePng({ width, height, pixels }: Rgba): Uint8Array {
  const stride = width * 4;
  const filtered = new Uint8Array(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 4;
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const a = x >= 4 ? pixels[i - 4] : 0;
      const b = y > 0 ? pixels[i - stride] : 0;
      const c = x >= 4 && y > 0 ? pixels[i - stride - 4] : 0;
      filtered[y * (stride + 1) + 1 + x] = (pixels[i] - paeth(a, b, c)) & 0xff;
    }
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(filtered, { level: 9 })),
    chunk("IEND", new Uint8Array(0)),
  ]);
}
