import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportVisitsCsv, getVisits, validateVisitByCode } from "@/lib/api";
import { Download, Loader2, Search } from "lucide-react";
import QrScanner from "qr-scanner";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";


const QRCodeScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [userCodeToValidate, setUserCodeToValidate] = useState("");
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [totalVisits, setTotalVisits] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);

  // Charger les visites avec filtres
  const fetchVisits = async () => {
    setLoading(true);
    try {
      const visitsData = await getVisits({
        user_id: searchUser || undefined,
        date_min: dateFrom || undefined,
        date_max: dateTo || undefined,
      });
      setVisits(visitsData);
      setTotalVisits(visitsData.length);
      const today = new Date().toISOString().slice(0, 10);
      setTodayVisits(visitsData.filter((v) => v.visit_date?.startsWith(today)).length);
    } catch {
      toast.error("Erreur lors du chargement des visites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  // Gestion scanner QR code
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
          preferredCamera: "environment", // force caméra arrière
        }
      );
      scannerRef.current.start();
    }

    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanning]);

  // Validation d'un code scanné ou saisi
  const handleValidateScan = async (code: string) => {
    setValidating(true);
    try {
      const res = await validateVisitByCode({ user_code: code.toUpperCase() });
      toast.success(res.message || `Visite validée pour le code : ${code}`);
      setScanResult(code);
      setUserCodeToValidate("");
      fetchVisits();
    } catch {
      toast.error("Erreur lors de la validation de la visite");
      setScanResult(null);
    } finally {
      setValidating(false);
    }
  };

  // Soumission validation manuelle par code saisi
  const handleValidateManual = async () => {
    if (userCodeToValidate.length !== 8) {
      toast.error("Le code utilisateur doit contenir 8 caractères");
      return;
    }
    await handleValidateScan(userCodeToValidate);
  };

  // Filtrage des visites via formulaire
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisits();
  };

  // Export CSV
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportVisitsCsv({
        user_id: searchUser || undefined,
        date_min: dateFrom || undefined,
        date_max: dateTo || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "visits_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export CSV généré");
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 bg-white rounded-3xl shadow-lg min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-primary mb-10">
        Scanner et Gérer les Visites Utilisateurs
      </h1>

      {/* Zone de scan QR code */}
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
        <>
          {/* Bouton pour démarrer le scan */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => {
                setScanning(true);
                setScanResult(null);
                setValidating(false);
              }}
              className="bg-indigo-600 text-white py-4 px-10 rounded-3xl hover:bg-indigo-700 transition"
            >
              📷 Démarrer le scan QR
            </Button>
          </div>

          {/* Validation manuelle par code */}
          <Card className="shadow-lg rounded-3xl border border-gray-200 p-8 mb-10">
            <CardHeader>
              <CardTitle className="text-xl font-bold mb-6">
                Validation manuelle par code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-6 items-center">
              <Input
                placeholder="Entrez le code utilisateur (8 caractères)"
                value={userCodeToValidate}
                onChange={(e) => setUserCodeToValidate(e.target.value.toUpperCase())}
                maxLength={8}
                className="flex-1 p-4 rounded-2xl border-2 border-primary text-xl focus:ring-2 focus:ring-primary"
              />
              <Button
                onClick={handleValidateManual}
                disabled={validating || userCodeToValidate.length !== 8}
                className="px-10 py-4 rounded-2xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition"
              >
                {validating ? "Validation en cours..." : "Valider la visite"}
              </Button>
            </CardContent>
          </Card>

          {/* Filtrage */}
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Input
              placeholder="Recherche par utilisateur"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="rounded-2xl p-4 border border-gray-300"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-2xl p-4 border border-gray-300"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-2xl p-4 border border-gray-300"
            />
            <Button type="submit" className="flex items-center gap-2 bg-primary text-white p-4 rounded-2xl hover:bg-primary-dark transition">
              <Search className="w-6 h-6" />
              Filtrer
            </Button>
          </form>

          {/* Export CSV */}
          <div className="flex justify-end mb-6">
            <Button
              onClick={handleExport}
              disabled={exporting}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-300 hover:bg-gray-100 transition"
            >
              {exporting ? <Loader2 className="animate-spin w-6 h-6" /> : <Download className="w-6 h-6" />}
              Exporter CSV
            </Button>
          </div>

          {/* Tableau des visites */}
          <Card className="shadow-lg rounded-3xl border border-gray-200 p-6 max-h-[500px] overflow-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold mb-4">Historique des visites</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="animate-spin w-14 h-14 text-primary" />
                </div>
              ) : visits.length === 0 ? (
                <p className="text-center text-gray-500 py-20 text-lg">Aucune visite trouvée.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>ID</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Date de visite</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-mono">{visit.id}</TableCell>
                        <TableCell>{visit.name} ({visit.user_id})</TableCell>
                        <TableCell>{visit.phone ?? "-"}</TableCell>
                        <TableCell>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QRCodeScanner;
