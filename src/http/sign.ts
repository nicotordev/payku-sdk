import CryptoJS from "crypto-js";

export type SignParams = Record<string, unknown>;

export function buildSign(
  apiPath: string,
  params: SignParams,
  privateToken: string,
): string {
  const requestPath = encodeURIComponent(apiPath);
  const searchParams = new URLSearchParams();

  for (const key of Object.keys(params).sort()) {
    const value = params[key];

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "object") {
      continue;
    }

    searchParams.append(key, String(value));
  }

  const arrayConcat = searchParams.toString();
  const concat = arrayConcat ? `${requestPath}&${arrayConcat}` : requestPath;

  return CryptoJS.HmacSHA256(concat, privateToken).toString();
}
