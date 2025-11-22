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
import { exportVisitsCsv, getVisits, registerVisit } from "@/lib/api";
import { format } from "date-fns";
import { Download, Loader2, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import QrScanner from "react-qr-scanner";
import { toast } from "sonner";

const AdminVisits = () => {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [totalVisits, setTotalVisits] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await getVisits();
      setVisits(data);
      setTotalVisits(data.length);
      const today = format(new Date(), "yyyy-MM-dd");
      setTodayVisits(
        data.filter((v: any) => v.visit_date?.slice(0, 10) === today).length
      );
    } catch {
      toast.error("Erreur lors du chargement des visites");
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter(
    (v) =>
      v.user_id.toLowerCase().includes(searchUser.toLowerCase()) ||
      v.name.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici, vous pouvez aussi appeler API avec filtres si voulu
    // Pour l'exemple, filtre local
  };

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
    } catch {
      toast.error("Erreur lors de l’export");
    } finally {
      setExporting(false);
    }
  };

  const handleScan = async (data: string | null) => {
    if (data && !scanResult) {
      setScanResult(data);
      setScanning(false);
      try {
        await registerVisit();
        toast.success("Visite enregistrée pour l'utilisateur " + data);
        loadVisits();
      } catch {
        toast.error("Erreur lors de l'enregistrement de la visite");
      }
    }
  };

  const handleError = (err: any) => {
    toast.error("Erreur lors de la capture du QR Code : " + err.message);
  };

  const previewStyle = {
    height: 240,
    width: 320,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Gestion des visites utilisateurs
      </h1>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total visites</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{totalVisits}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Visites aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{todayVisits}</span>
          </CardContent>
        </Card>
      </div>

      {/* Scanner QR Code */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scanner un QR Utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          {!scanning ? (
            <Button
              onClick={() => {
                setScanning(true);
                setScanResult(null);
              }}
            >
              📷 Lancer la caméra
            </Button>
          ) : (
            <>
              <QrScanner
                delay={300}
                style={previewStyle}
                onError={handleError}
                onScan={handleScan}
                facingMode="environment"
              />
              <Button onClick={() => setScanning(false)} variant="outline" className="mt-4">
                Arrêter
              </Button>
            </>
          )}
          {scanResult && (
            <p className="mt-4 text-green-600">
              QR reconnu : <span className="font-mono">{scanResult}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filtres */}
      <form className="flex flex-col sm:flex-row gap-3 mb-4" onSubmit={handleFilter}>
        <Input
          placeholder="Recherche par utilisateur"
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="max-w-xs"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="max-w-xs"
        />
        <Button type="submit" className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Filtrer
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2"
        >
          {exporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
          Exporter CSV
        </Button>
      </form>

      {/* Tableau des visites */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des visites</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="animate-spin w-10 h-10 mx-auto" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>id</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Date de visite</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisits.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6">
                        Aucune visite trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-mono">{visit.id}</TableCell>
                      <TableCell>{visit.name} ({visit.user_id})</TableCell>
                      <TableCell>
                        {visit.visit_date ? format(new Date(visit.visit_date), "dd/MM/yyyy HH:mm") : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVisits;
