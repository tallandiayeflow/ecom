// src/pages/admin/QRCodeScanner.tsx
import { Button } from "@/components/ui/button";
import { validateVisitByCode } from "@/lib/api";
import { Loader2 } from "lucide-react";
import QrScanner from "qr-scanner";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const QRCodeScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  // Fonction pour valider le code scanné
  const handleValidateScan = async (code: string) => {
    setValidating(true);
    try {
      const res = await validateVisitByCode({ user_code: code.toUpperCase() });
      toast.success(res.message || "Visite validée avec succès !");
      setScanResult(code);
    } catch {
      toast.error("Erreur lors de la validation de la visite");
      setScanResult(null);
    } finally {
      setValidating(false);
    }
  };

  // Démarrage / arrêt du scanner
  useEffect(() => {
    if (scanning && videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          if (result?.data && !validating) {
            handleValidateScan(result.data);
            scannerRef.current?.stop();
            setScanning(false);
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment", // caméra arrière
        }
      );
      scannerRef.current.start();
    }

    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanning]);

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-10 bg-white rounded-3xl shadow-lg min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-primary mb-10">
        Scanner et Valider un QR Code
      </h1>

      {scanning ? (
        <div className="flex flex-col items-center justify-center space-y-6">
          <video
            ref={videoRef}
            className="w-full max-w-md rounded-2xl border border-gray-300"
            muted
            autoPlay
          />
          <Button
            onClick={() => {
              setScanning(false);
              setScanResult(null);
              setValidating(false);
              scannerRef.current?.stop();
            }}
            className="px-8 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition"
          >
            Arrêter le scan
          </Button>

          {validating && (
            <div className="flex items-center space-x-2 mt-4 text-primary text-lg font-semibold">
              <Loader2 className="animate-spin w-6 h-6" />
              <span>Validation en cours...</span>
            </div>
          )}

          {scanResult && !validating && (
            <div className="mt-4 text-green-600 font-medium text-center">
              Visite validée pour le code : <span className="font-mono">{scanResult}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-6">
          <Button
            onClick={() => {
              setScanning(true);
              setScanResult(null);
              setValidating(false);
            }}
            className="bg-indigo-600 text-white py-4 px-10 rounded-3xl hover:bg-indigo-700 transition"
          >
            📷 Démarrer le scan
          </Button>

          {scanResult && !validating && (
            <div className="mt-4 text-green-600 font-medium text-center">
              Dernier code validé : <span className="font-mono">{scanResult}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
