export interface PixPaymentData {
  pixKey: string;
  receiverName: string;
  receiverCity?: string;
  amount?: string;
  description?: string;
  txid?: string;
}

const DEFAULT_MERCHANT_NAME = "RECEBEDOR PIX";
const DEFAULT_MERCHANT_CITY = "SAO PAULO";
const DEFAULT_TXID = "***";

const tlv = (id: string, value: string): string => {
  const size = value.length.toString().padStart(2, "0");
  return `${id}${size}${value}`;
};

const sanitizeAscii = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();

const normalizeMerchantField = (value: string, maxLength: number): string =>
  sanitizeAscii(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 $%*+\-./:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const normalizeDescription = (value: string): string =>
  sanitizeAscii(value).replace(/\s+/g, " ").trim().slice(0, 72);

const normalizeTxid = (value: string | undefined): string => {
  if (!value?.trim()) return DEFAULT_TXID;

  const cleaned = normalizeMerchantField(value, 25).replace(/\s+/g, "");
  return cleaned || DEFAULT_TXID;
};

export const normalizeAmount = (value: string): string | undefined => {
  if (!value.trim()) return undefined;

  const numeric = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (!numeric) return undefined;

  const amount = Number(numeric);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return amount.toFixed(2);
};

const crc16 = (payload: string): string => {
  let crc = 0xffff;

  for (const character of payload) {
    crc ^= character.charCodeAt(0) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      const overflow = crc & 0x8000;
      crc = (crc << 1) & 0xffff;
      if (overflow) crc ^= 0x1021;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
};

export const generatePixPayload = (paymentData: PixPaymentData): string => {
  const merchantName =
    normalizeMerchantField(paymentData.receiverName, 25) || DEFAULT_MERCHANT_NAME;
  const merchantCity =
    normalizeMerchantField(paymentData.receiverCity ?? "", 15) || DEFAULT_MERCHANT_CITY;
  const amount = paymentData.amount?.trim();
  const description = paymentData.description ? normalizeDescription(paymentData.description) : "";
  const txid = normalizeTxid(paymentData.txid);

  const pixAccount = [
    tlv("00", "BR.GOV.BCB.PIX"),
    tlv("01", paymentData.pixKey.trim()),
    description ? tlv("02", description) : "",
  ].join("");

  const additionalData = tlv("05", txid);

  const payloadWithoutCrc = [
    tlv("00", "01"),
    tlv("01", amount ? "12" : "11"),
    tlv("26", pixAccount),
    tlv("52", "0000"),
    tlv("53", "986"),
    amount ? tlv("54", amount) : "",
    tlv("58", "BR"),
    tlv("59", merchantName),
    tlv("60", merchantCity),
    tlv("62", additionalData),
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16(payloadWithoutCrc)}`;
};
