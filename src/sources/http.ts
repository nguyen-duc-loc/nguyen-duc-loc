// Shared helpers for source fetchers. Throw these so refresh can decide whether to retry.

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, url: string) {
    super(`HTTP ${status} from ${url}`);
    this.name = "HttpError";
    this.status = status;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** GET a JSON document. Throws HttpError on a non 2xx status. */
export async function fetchJson(url: string, signal: AbortSignal, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, { ...init, signal });
  if (!response.ok) throw new HttpError(response.status, url);
  return response.json();
}
