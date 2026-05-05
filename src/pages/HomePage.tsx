import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import brazilCapitals from "../data/brazil-capitals.json";
import { generatePixPayload, normalizeAmount } from "../lib/pix";
import {
  getPixKeyOption,
  getPixKeyOptions,
  maskPixKeyInput,
  normalizePixKey,
  validatePixKey,
  type PixKeyType,
} from "../lib/pixKey";
import type { PaymentLinkPayload } from "../lib/token";
import { encodePaymentToken } from "../lib/token";

interface FormValues {
  pixKeyType: PixKeyType;
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  amount: string;
  description: string;
  txid: string;
}

interface CapitalOption {
  uf: string;
  capital: string;
}

const CAPITAL_OPTIONS = brazilCapitals as CapitalOption[];

const INITIAL_VALUES: FormValues = {
  pixKeyType: "email",
  pixKey: "",
  receiverName: "",
  receiverCity: "",
  amount: "",
  description: "",
  txid: "",
};

const copyText = async (value: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

export default function HomePage() {
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_VALUES);
  const [paymentLink, setPaymentLink] = useState("");
  const [pixPayload, setPixPayload] = useState("");
  const [token, setToken] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const pixKeyOptions = useMemo(() => getPixKeyOptions(), []);
  const selectedPixKeyOption = useMemo(
    () => getPixKeyOption(formValues.pixKeyType),
    [formValues.pixKeyType],
  );

  const shareableUrl = useMemo(() => {
    if (!token) return "";
    return `${window.location.origin}${window.location.pathname}#/pagamento/${token}`;
  }, [token]);

  const handlePixKeyTypeChange = (value: PixKeyType): void => {
    setFormValues((current) => ({
      ...current,
      pixKeyType: value,
      pixKey: "",
    }));
    setError("");
    setFeedback("");
  };

  const handleInputChange = (field: keyof FormValues, value: string): void => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handlePixKeyChange = (value: string): void => {
    const masked = maskPixKeyInput(formValues.pixKeyType, value);
    handleInputChange("pixKey", masked);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFeedback("");
    setError("");

    const pixKeyValidationError = validatePixKey(formValues.pixKeyType, formValues.pixKey);
    if (pixKeyValidationError) {
      setError(pixKeyValidationError);
      return;
    }

    const pixKey = normalizePixKey(formValues.pixKeyType, formValues.pixKey);
    const receiverName = formValues.receiverName.trim();
    const receiverCity = formValues.receiverCity.trim();

    if (!receiverName) {
      setError("Preencha o nome do recebedor.");
      return;
    }

    if (!receiverCity) {
      setError("Selecione a cidade do recebedor.");
      return;
    }

    const normalizedAmount = normalizeAmount(formValues.amount);
    if (formValues.amount.trim() && !normalizedAmount) {
      setError("Valor invalido. Use um numero maior que zero, ex: 25,90.");
      return;
    }

    const payload: PaymentLinkPayload = {
      pixKey,
      receiverName,
      receiverCity,
      amount: normalizedAmount,
      description: formValues.description.trim() || undefined,
      txid: formValues.txid.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const pixCode = generatePixPayload(payload);
    const paymentToken = encodePaymentToken(payload);

    setPixPayload(pixCode);
    setToken(paymentToken);
    setPaymentLink(`${window.location.origin}${window.location.pathname}#/pagamento/${paymentToken}`);
    setFeedback("Link gerado com sucesso.");
  };

  const handleCopy = async (value: string, message: string): Promise<void> => {
    const copied = await copyText(value);
    setFeedback(copied ? message : "Seu navegador bloqueou a copia automatica.");
  };

  return (
    <main className="generator-page">
      <header className="generator-hero">
        <h1 className="title-with-icon">
          <span className="pix-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="presentation">
              <g transform="rotate(45 16 16)" fill="currentColor">
                <rect x="13" y="2" width="6" height="10" rx="3" />
                <rect x="20" y="13" width="10" height="6" rx="3" />
                <rect x="13" y="20" width="6" height="10" rx="3" />
                <rect x="2" y="13" width="10" height="6" rx="3" />
              </g>
            </svg>
          </span>
          <span>Link de pagamento Pix</span>
        </h1>
      </header>

      <section className="generator-grid">
        <article className="panel">
          <h2>Dados da cobranca</h2>
          <form className="payment-form" onSubmit={handleSubmit}>
            <label>
              Tipo da chave Pix
              <select
                value={formValues.pixKeyType}
                onChange={(event) => handlePixKeyTypeChange(event.target.value as PixKeyType)}
              >
                {pixKeyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Chave Pix
              <input
                type={selectedPixKeyOption.inputMode === "email" ? "email" : "text"}
                inputMode={selectedPixKeyOption.inputMode}
                value={formValues.pixKey}
                onChange={(event) => handlePixKeyChange(event.target.value)}
                placeholder={selectedPixKeyOption.placeholder}
                required
              />
            </label>

            <label>
              Nome do recebedor
              <input
                type="text"
                value={formValues.receiverName}
                onChange={(event) => handleInputChange("receiverName", event.target.value)}
                placeholder="Nome exibido no QR Code"
                required
              />
            </label>

            <label>
              Cidade do recebedor
              <select
                value={formValues.receiverCity}
                onChange={(event) => handleInputChange("receiverCity", event.target.value)}
                required
              >
                <option value="">Selecione uma capital</option>
                {CAPITAL_OPTIONS.map((option) => (
                  <option key={option.uf} value={option.capital}>
                    {option.capital} - {option.uf}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Valor (opcional)
              <input
                type="text"
                value={formValues.amount}
                onChange={(event) => handleInputChange("amount", event.target.value)}
                placeholder="Ex: 39,90"
              />
            </label>

            <label>
              Descricao (opcional)
              <input
                type="text"
                value={formValues.description}
                onChange={(event) => handleInputChange("description", event.target.value)}
                placeholder="Ex: Pedido #1234"
              />
            </label>

            <label>
              TXID/Referencia (opcional)
              <input
                type="text"
                value={formValues.txid}
                onChange={(event) => handleInputChange("txid", event.target.value)}
                placeholder="Se vazio, usa ***"
              />
            </label>

            <button className="primary-button" type="submit">
              Gerar link
            </button>
          </form>
          {error ? <p className="message error">{error}</p> : null}
          {feedback ? <p className="message success">{feedback}</p> : null}
        </article>

        <article className="panel">
          <h2>Resultado</h2>

          {!pixPayload ? (
            <p className="empty-message">Preencha os dados e clique em gerar link.</p>
          ) : (
            <div className="result-content">
              <div className="qr-wrapper">
                <QRCodeSVG value={pixPayload} size={220} bgColor="#FFFFFF" fgColor="#071722" />
              </div>

              <label className="result-field">
                Link de pagamento
                <textarea readOnly value={paymentLink} rows={3} />
              </label>

              <label className="result-field">
                Pix copia e cola
                <textarea readOnly value={pixPayload} rows={5} />
              </label>

              <div className="actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleCopy(paymentLink, "Link copiado.")}
                >
                  Copiar link
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleCopy(pixPayload, "Codigo Pix copiado.")}
                >
                  Copiar Pix
                </button>

                <Link className="primary-button link-button" to={`/pagamento/${token}`}>
                  Abrir pagina de pagamento
                </Link>
              </div>

              {shareableUrl ? (
                <p className="hint">
                  URL publica: <span>{shareableUrl}</span>
                </p>
              ) : null}
            </div>
          )}

          <p className="hint">O link de pagamento gerado tem duração de 1 ano.</p>
        </article>
      </section>
    </main>
  );
}
