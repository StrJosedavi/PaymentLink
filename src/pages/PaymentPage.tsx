import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { generatePixPayload } from "../lib/pix";
import {
  decodePaymentToken,
  getPaymentLinkExpirationDate,
  isPaymentLinkExpired,
} from "../lib/token";

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

export default function PaymentPage() {
  const { token = "" } = useParams();
  const [feedback, setFeedback] = useState("");
  const payload = useMemo(() => decodePaymentToken(token), [token]);
  const expirationDate = useMemo(
    () => (payload ? getPaymentLinkExpirationDate(payload) : null),
    [payload],
  );
  const isExpired = useMemo(() => (payload ? isPaymentLinkExpired(payload) : false), [payload]);
  const pixCode = useMemo(() => (payload ? generatePixPayload(payload) : ""), [payload]);

  if (!payload) {
    return (
      <main className="error-page">
        <div className="error-card">
          <h1>Link invalido</h1>
          <p>Nao foi possivel carregar este link de pagamento Pix.</p>
          <Link className="primary-button link-button" to="/">
            Voltar ao gerador
          </Link>
        </div>
      </main>
    );
  }

  if (isExpired) {
    return (
      <main className="error-page">
        <div className="error-card">
          <h1>Link expirado</h1>
          <p>
            Este link de pagamento venceu{" "}
            {expirationDate
              ? `em ${expirationDate.toLocaleDateString("pt-BR")}.`
              : "ha mais de 1 ano."}
          </p>
          <Link className="primary-button link-button" to="/">
            Gerar novo link
          </Link>
        </div>
      </main>
    );
  }

  const hasAmount = Boolean(payload.amount);

  return (
    <main className="payment-page">
      <aside className="payment-brand">
        <div className="brand-mark" />
        <p>Pague com Pix em segundos.</p>
      </aside>

      <section className="payment-content">
        <div className="payment-card">
          <h1>Link de Pagamento</h1>
          <p className="receiver-name">{payload.receiverName}</p>

          {hasAmount ? (
            <p className="amount">Valor: R$ {payload.amount}</p>
          ) : (
            <p className="amount">Valor em aberto</p>
          )}

          <div className="qr-wrapper">
            <QRCodeSVG value={pixCode} size={260} bgColor="#FFFFFF" fgColor="#071722" />
          </div>

          <p className="label">Use o codigo Pix copia e cola:</p>
          <textarea className="pix-code" readOnly value={pixCode} rows={6} />

          <div className="actions">
            <button
              className="primary-button"
              type="button"
              onClick={async () => {
                const copied = await copyText(pixCode);
                setFeedback(copied ? "Codigo Pix copiado." : "Seu navegador bloqueou a copia automatica.");
              }}
            >
              Copiar codigo Pix
            </button>

            <Link className="secondary-button link-button" to="/">
              Criar novo link
            </Link>
          </div>

          {feedback ? <p className="message success">{feedback}</p> : null}
        </div>
      </section>
    </main>
  );
}
