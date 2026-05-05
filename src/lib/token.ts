import type { PixPaymentData } from "./pix";

export interface PaymentLinkPayload extends PixPaymentData {
  createdAt: string;
}

export const PAYMENT_LINK_VALIDITY_YEARS = 1;

const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeBase64Url = (value: string): string => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const isPayload = (input: unknown): input is PaymentLinkPayload => {
  if (!input || typeof input !== "object") return false;

  const candidate = input as Record<string, unknown>;
  const hasValidCity =
    candidate.receiverCity === undefined || typeof candidate.receiverCity === "string";

  return (
    typeof candidate.createdAt === "string" &&
    typeof candidate.pixKey === "string" &&
    typeof candidate.receiverName === "string" &&
    hasValidCity
  );
};

export const encodePaymentToken = (payload: PaymentLinkPayload): string =>
  encodeBase64Url(JSON.stringify(payload));

export const decodePaymentToken = (token: string): PaymentLinkPayload | null => {
  try {
    const parsed = JSON.parse(decodeBase64Url(token));
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const getPaymentLinkExpirationDate = (
  payload: PaymentLinkPayload,
): Date | null => {
  const createdAt = new Date(payload.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  const expiresAt = new Date(createdAt);
  expiresAt.setFullYear(expiresAt.getFullYear() + PAYMENT_LINK_VALIDITY_YEARS);
  return expiresAt;
};

export const isPaymentLinkExpired = (
  payload: PaymentLinkPayload,
  now: Date = new Date(),
): boolean => {
  const expirationDate = getPaymentLinkExpirationDate(payload);
  if (!expirationDate) return true;
  return now.getTime() > expirationDate.getTime();
};
