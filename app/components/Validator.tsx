"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
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
      // Vibra no celular para dar feedback (quando suportado).
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(data.valid && !data.alreadyChecked ? 120 : [60, 60, 60]);
      }
    } catch {
      setResult({ valid: false, reason: "Erro de rede." });
    } finally {
      setLoading(false);
    }
  }

  function stopScan() {
    setScanning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function scanLoop() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!streamRef.current || !v || !c) return;

    if (v.readyState === v.HAVE_ENOUGH_DATA && v.videoWidth) {
      // Reduz a resolução para acelerar a leitura no celular.
      const maxW = 520;
      const scale = Math.min(1, maxW / v.videoWidth);
      const w = Math.round(v.videoWidth * scale);
      const h = Math.round(v.videoHeight * scale);
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(v, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" });
        if (code && code.data && !busyRef.current) {
          busyRef.current = true;
          const raw = code.data;
          stopScan();
          validate(raw).finally(() => {
            busyRef.current = false;
          });
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }

  async function startScan() {
    setScanError("");
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Câmera não disponível neste navegador. Use a entrada manual.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        v.setAttribute("playsinline", "true");
        await v.play();
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setScanError(
        "Não foi possível acessar a câmera. Autorize o acesso à câmera e tente de novo."
      );
      stopScan();
    }
  }

  useEffect(() => () => stopScan(), []);

  return (
    <div>
      <div className="card" style={{ marginTop: 16 }}>
        {!scanning ? (
          <button
            className="btn-block btn-lime"
            onClick={startScan}
            style={{
              marginTop: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Icon name="camera" size={18} /> Escanear com a câmera
          </button>
        ) : (
          <>
            <div className="scanner">
              <video ref={videoRef} playsInline muted className="scanner-video" />
              <div className="scanner-frame" />
              <div className="scanner-hint">Aponte para o QR do ingresso</div>
            </div>
            <button className="btn-ghost btn-block" onClick={stopScan}>
              Parar
            </button>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {scanError && <div className="error">{scanError}</div>}

        <label htmlFor="manual">Ou digite/cole o código do ingresso</label>
        <input
          id="manual"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="código do ingresso"
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
          {!scanning && (
            <button className="btn-block btn-lime" onClick={startScan} style={{ marginTop: 14 }}>
              Escanear o próximo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
