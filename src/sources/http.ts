// Shared helpers for source fetchers. Throw these so refresh can decide whether to retry.

/** Sent by every source, so a site owner can see who is calling and how to reach the owner. */
export const USER_AGENT = "nguyen-duc-loc-profile (+https://github.com/nguyen-duc-loc/nguyen-duc-loc)";

export class HttpError extends Error {
  readonly status: number;

  /** `detail` (for example a GraphQL error message) is appended to the message; `status` stays the reported reason. */
  constructor(status: number, url: string, detail?: string) {
    super(detail === undefined ? `HTTP ${status} from ${url}` : `HTTP ${status} from ${url}: ${detail}`);
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
