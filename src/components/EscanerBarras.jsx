import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Escáner de códigos de barras con la cámara.
 * Usa la API nativa BarcodeDetector cuando existe (Android/Chrome);
 * si no, cae a ZXing (importado bajo demanda para no engordar el bundle).
 * Requiere HTTPS o localhost para poder abrir la cámara.
 */
export default function EscanerBarras({ onDetectado, onCerrar }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    let stream = null;
    let rafId = null;
    let zxingControls = null;

    const detener = () => {
      if (rafId) cancelAnimationFrame(rafId);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };

    const reportar = (codigo) => {
      if (!activo) return;
      activo = false;
      navigator.vibrate?.(80);
      detener();
      onDetectado(codigo);
    };

    async function iniciar() {
      try {
        if ('BarcodeDetector' in window) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
          if (!activo) { stream.getTracks().forEach((t) => t.stop()); return; }
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
          });
          const escanear = async () => {
            if (!activo) return;
            try {
              const codigos = await detector.detect(videoRef.current);
              if (codigos.length > 0) { reportar(codigos[0].rawValue); return; }
            } catch { /* frame no listo aún */ }
            rafId = requestAnimationFrame(escanear);
          };
          rafId = requestAnimationFrame(escanear);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const lector = new BrowserMultiFormatReader();
          zxingControls = await lector.decodeFromVideoDevice(undefined, videoRef.current, (resultado) => {
            if (resultado) reportar(resultado.getText());
          });
        }
      } catch (e) {
        console.error('Error al abrir la cámara:', e);
        if (activo) {
          setError(e.name === 'NotAllowedError'
            ? 'Permiso de cámara denegado. Actívalo en la configuración del navegador.'
            : 'No se pudo abrir la cámara en este dispositivo.');
        }
      }
    }

    iniciar();
    return () => { activo = false; detener(); };
  }, [onDetectado]);

  return (
    <div className="scanner-overlay" onClick={onCerrar}>
      <div className="scanner-panel" onClick={(e) => e.stopPropagation()}>
        <div className="scanner-header">
          <span>Escanear código</span>
          <button className="icon-btn" onClick={onCerrar} aria-label="Cerrar" style={{ color: '#fff' }}>
            <X size={18} />
          </button>
        </div>
        {error ? (
          <div className="scanner-error">{error}</div>
        ) : (
          <div className="scanner-video-wrap">
            <video ref={videoRef} playsInline muted />
            <div className="scanner-guia" />
          </div>
        )}
        <p className="scanner-hint">Apunta al código de barras del producto</p>
      </div>
    </div>
  );
}
