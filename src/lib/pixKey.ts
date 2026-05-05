export type PixKeyType = "email" | "cpf" | "phone" | "random";

interface PixKeyOption {
  value: PixKeyType;
  label: string;
  placeholder: string;
  inputMode: "text" | "email" | "numeric";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PIX_KEY_OPTIONS: PixKeyOption[] = [
  {
    value: "email",
    label: "E-mail",
    placeholder: "nome@dominio.com",
    inputMode: "email",
  },
  {
    value: "cpf",
    label: "CPF",
    placeholder: "000.000.000-00",
    inputMode: "numeric",
  },
  {
    value: "phone",
    label: "Celular",
    placeholder: "(11) 99999-9999",
    inputMode: "numeric",
  },
  {
    value: "random",
    label: "Chave aleatoria",
    placeholder: "123e4567-e89b-12d3-a456-426614174000",
    inputMode: "text",
  },
];

const digitsOnly = (value: string): string => value.replace(/\D/g, "");

const formatCpf = (value: string): string => {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const parsePhoneLocalDigits = (value: string): string => {
  const digits = digitsOnly(value);
  if (digits.startsWith("55")) return digits.slice(2, 13);
  return digits.slice(0, 11);
};

const formatPhone = (value: string): string => {
  if (!value.trim()) return "";

  const localDigits = parsePhoneLocalDigits(value);
  if (!localDigits) return "";
  if (localDigits.length <= 2) return `(${localDigits}`;
  if (localDigits.length <= 7) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  }

  return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7, 11)}`;
};

const formatRandomKey = (value: string): string => {
  const hex = value.toLowerCase().replace(/[^0-9a-f]/g, "").slice(0, 32);
  const parts = [8, 4, 4, 4, 12];
  const chunks: string[] = [];
  let cursor = 0;

  parts.forEach((size) => {
    if (cursor >= hex.length) return;
    chunks.push(hex.slice(cursor, cursor + size));
    cursor += size;
  });

  return chunks.join("-");
};

const isValidCpf = (cpf: string): boolean => {
  const digits = digitsOnly(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(digits[index]) * (10 - index);
  }
  let checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) checkDigit = 0;
  if (checkDigit !== Number(digits[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(digits[index]) * (11 - index);
  }
  checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) checkDigit = 0;
  return checkDigit === Number(digits[10]);
};

const normalizeEmail = (value: string): string =>
  value.replace(/\s+/g, "").trim().toLowerCase().slice(0, 77);

export const getPixKeyOptions = (): PixKeyOption[] => PIX_KEY_OPTIONS;

export const getPixKeyOption = (pixKeyType: PixKeyType): PixKeyOption =>
  PIX_KEY_OPTIONS.find((option) => option.value === pixKeyType) ?? PIX_KEY_OPTIONS[0];

export const maskPixKeyInput = (pixKeyType: PixKeyType, value: string): string => {
  switch (pixKeyType) {
    case "email":
      return normalizeEmail(value);
    case "cpf":
      return formatCpf(value);
    case "phone":
      return formatPhone(value);
    case "random":
      return formatRandomKey(value);
    default:
      return value;
  }
};

export const normalizePixKey = (pixKeyType: PixKeyType, value: string): string => {
  switch (pixKeyType) {
    case "email":
      return normalizeEmail(value);
    case "cpf":
      return digitsOnly(value).slice(0, 11);
    case "phone": {
      const localDigits = parsePhoneLocalDigits(value);
      return `+55${localDigits}`;
    }
    case "random":
      return formatRandomKey(value);
    default:
      return value.trim();
  }
};

export const validatePixKey = (pixKeyType: PixKeyType, value: string): string | null => {
  const normalized = normalizePixKey(pixKeyType, value);

  if (!normalized) return "Informe a chave Pix.";

  switch (pixKeyType) {
    case "email":
      return EMAIL_REGEX.test(normalized) ? null : "E-mail invalido.";
    case "cpf":
      return isValidCpf(normalized) ? null : "CPF invalido.";
    case "phone":
      return /^\+55\d{11}$/.test(normalized) ? null : "Celular invalido. Use DDD + numero.";
    case "random":
      return UUID_REGEX.test(normalized) ? null : "Chave aleatoria invalida.";
    default:
      return null;
  }
};
