"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

type Result = {
  valid: boolean;
  alreadyChecked?: boolean;
  name?: string;
  reason?: string;
  checkedInAt?: string | null;
};

export default function Validator({ eventId }: { eventId: string }) {
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);

  async function validate(token: string) {
    if (!token) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, reason: "Erro de rede." });
    } finally {
      setLoading(false);
    }
  }

  function stopScan() {
    setScanning(false);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startScan() {
    setScanError("");
    setResult(null);
    const Detector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (!Detector) {
      setScanError(
        "Leitor de câmera não suportado neste navegador. Use a entrada manual abaixo."
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new Detector({ formats: ["qr_code"] });

      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length && !busyRef.current) {
            busyRef.current = true;
            const raw = codes[0].rawValue as string;
            stopScan();
            await validate(raw);
            busyRef.current = false;
            return;
          }
        } catch {
          /* frame sem código */
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setScanError("Não foi possível acessar a câmera.");
      stopScan();
    }
  }

  useEffect(() => () => stopScan(), []);

  return (
    <div>
      <div className="card" style={{ marginTop: 16 }}>
        {!scanning ? (
          <button
            className="btn-block"
            onClick={startScan}
            style={{ marginTop: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Icon name="camera" size={16} /> Escanear QR Code
          </button>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", borderRadius: 12, background: "#000" }}
            />
            <button className="btn-ghost btn-block" onClick={stopScan}>
              Parar
            </button>
          </>
        )}
        {scanError && <div className="error">{scanError}</div>}

        <label htmlFor="manual">Ou cole o código / link do ingresso</label>
        <input
          id="manual"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="ex.: a1b2c3... ou .../ingresso/a1b2c3"
        />
        <button
          className="btn-block"
          disabled={loading || !manual.trim()}
          onClick={() => validate(manual.trim())}
        >
          {loading ? "Verificando..." : "Verificar"}
        </button>
      </div>

      {result && (
        <div
          className="card center"
          style={{
            marginTop: 16,
            borderColor: result.valid
              ? result.alreadyChecked
                ? "var(--warn)"
                : "var(--ok)"
              : "var(--err)",
          }}
        >
          {result.valid ? (
            result.alreadyChecked ? (
              <>
                <div style={{ color: "var(--warn)" }}>
                  <Icon name="warn" size={44} />
                </div>
                <h2 style={{ color: "var(--warn)" }}>Entrada já registrada</h2>
                <p style={{ fontWeight: 600 }}>{result.name}</p>
                {result.checkedInAt && (
                  <p className="muted">
                    em {new Date(result.checkedInAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </>
            ) : (
              <>
                <div style={{ color: "var(--ok)" }}>
                  <Icon name="check" size={44} />
                </div>
                <h2 style={{ color: "var(--ok)" }}>Entrada liberada</h2>
                <p style={{ fontWeight: 600 }}>{result.name}</p>
              </>
            )
          ) : (
            <>
              <div style={{ color: "var(--err)" }}>
                <Icon name="block" size={44} />
              </div>
              <h2 style={{ color: "var(--err)" }}>Ingresso inválido</h2>
              <p className="muted">{result.reason}</p>
              {result.name && <p style={{ fontWeight: 600 }}>{result.name}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
