import { createHash } from "node:crypto";

/**
 * PayFast signing.
 *
 * PayFast's reference code is PHP, and its signature is an MD5 over
 * `key=value&key=value` where each value went through PHP's `urlencode()`. That
 * is not the same as JS `encodeURIComponent`: PHP also percent-encodes
 * `! ' ( ) * ~` and writes spaces as `+`. A name like `O'Brien` signs
 * differently under the two, so we match PHP here or PayFast answers
 * "Generated signature does not match submitted signature".
 */
function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(
      /[!'()*~]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    )
    .replace(/%20/g, "+");
}

export type PayFastEntry = [key: string, value: string];

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

/**
 * Outbound checkout signature.
 *
 * ORDER MATTERS: the string is built in the order the fields are posted, so the
 * caller must post them in exactly the order given here. Empty values are left
 * out of both the signature and the form.
 */
export function signCheckout(
  entries: PayFastEntry[],
  passphrase: string,
): { entries: PayFastEntry[]; signature: string } {
  const present = entries
    .map(([key, value]): PayFastEntry => [key, value.trim()])
    .filter(([, value]) => value !== "");

  const params = present.map(([key, value]) => `${key}=${pfEncode(value)}`);
  if (passphrase) params.push(`passphrase=${pfEncode(passphrase.trim())}`);

  return { entries: present, signature: md5(params.join("&")) };
}

/**
 * Inbound ITN verification.
 *
 * Unlike checkout, an ITN signature covers every posted field in the order
 * received — including empty ones — except `signature` itself. Returns the
 * param string too: PayFast's server-side validate call needs it verbatim,
 * WITHOUT the passphrase.
 */
export function verifyItn(
  entries: PayFastEntry[],
  passphrase: string,
): { valid: boolean; paramString: string } {
  const received = entries.find(([key]) => key === "signature")?.[1] ?? "";
  const params = entries
    .filter(([key]) => key !== "signature")
    .map(([key, value]) => `${key}=${pfEncode(value)}`);

  const paramString = params.join("&");
  const signed = passphrase
    ? `${paramString}&passphrase=${pfEncode(passphrase.trim())}`
    : paramString;

  return {
    valid: received !== "" && md5(signed) === received.toLowerCase(),
    paramString,
  };
}
