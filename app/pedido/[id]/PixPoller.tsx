"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  qrImage: string | null;
  payload: string | null;
  initialStatus: string;
  initialToken: string | null;
};

export default function PixPoller({
  orderId,
  qrImage,
  payload,
  initialStatus,
  initialToken,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "PAID") {
      const token = initialToken;
      if (token) router.replace(`/ingresso/${token}`);
      return;
    }
    let active = true;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${orderId}`, { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        if (data.status === "PAID" && data.ticketToken) {
          setStatus("PAID");
          clearInterval(timer);
          router.replace(`/ingresso/${data.ticketToken}`);
        }
      } catch {
        /* ignora falhas transitórias de rede */
      }
    }, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId, status, initialToken, router]);

  async function copy() {
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "PAID") {
    return (
      <p style={{ marginTop: 24 }}>
        Pagamento confirmado! Redirecionando para o seu ingresso…
      </p>
    );
  }

  return (
    <div>
      <p className="muted" style={{ marginTop: 12 }}>
        Escaneie o QR Code no app do seu banco ou use o Copia e Cola.
      </p>

      {qrImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="qr"
          src={`data:image/png;base64,${qrImage}`}
          alt="QR Code PIX"
        />
      )}

      {payload && (
        <>
          <div className="copia">{payload}</div>
          <button className="btn-block" onClick={copy}>
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
        </>
      )}

      <div style={{ marginTop: 24 }} className="muted">
        <span className="spinner" />{" "}
        <span style={{ marginLeft: 8 }}>Aguardando confirmação do pagamento…</span>
      </div>
      <p className="muted" style={{ fontSize: "0.82rem", marginTop: 10 }}>
        Assim que o PIX for confirmado, seu ingresso aparece automaticamente aqui.
        Pode deixar esta página aberta.
      </p>
    </div>
  );
}
