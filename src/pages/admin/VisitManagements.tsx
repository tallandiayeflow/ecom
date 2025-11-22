"use client";

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
import { motion } from "framer-motion";
import { Camera, Download, Loader2, Search, StopCircle } from "lucide-react";
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
  const [userCodeToValidate, setUserCodeToValidate] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async (filters?: { user_id?: string; date_min?: string; date_max?: string }) => {
    setLoading(true);
    try {
      const data = await getVisits(filters);
      setVisits(data);
      setTotalVisits(data.length);

      const today = new Date().toISOString().slice(0, 10);
      setTodayVisits(data.filter(v => v.visit_date?.startsWith(today)).length);
    } catch {
      toast.error("Erreur lors du chargement des visites");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadVisits({
      user_id: searchUser || undefined,
      date_min: dateFrom || undefined,
      date_max: dateTo || undefined,
    });
  };

  const filteredVisits = visits.filter(
    v =>
      v.user_id.toLowerCase().includes(searchUser.toLowerCase()) ||
      v.name.toLowerCase().includes(searchUser.toLowerCase())
  );

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

  const handleValidateVisit = async () => {
    if (userCodeToValidate.length !== 8) {
      toast.error("Le code doit contenir 8 caractères");
      return;
    }
    setValidating(true);
    try {
      const res = await validateVisitByCode({ user_code: userCodeToValidate.toUpperCase() });
      toast.success(res.message);
      setUserCodeToValidate("");
      loadVisits();
    } catch {
      toast.error("Erreur lors de la validation de la visite");
    } finally {
      setValidating(false);
    }
  };

  const handleScan = async (data: any) => {
    if (data && typeof data === "string" && !scanResult) {
      setScanResult(data);
      setScanning(false);
      setUserCodeToValidate(data.toUpperCase());

      try {
        await validateVisitByCode({ user_code: data.toUpperCase() });
        toast.success("Visite validée pour le code " + data);
        loadVisits();
      } catch {
        toast.error("Erreur lors de la validation de la visite");
      }
    }
  };

  const handleError = (err: any) => {
    toast.error("Erreur lors de la capture du QR Code");
  };

  const previewStyle = { height: 260, width: 340 };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 transition-colors">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-bold text-center mb-6"
      >
        Gestion des Visites Utilisateurs
      </motion.h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-lg border border-muted/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Total Visites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-extrabold">{totalVisits}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border border-muted/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Visites Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-extrabold">{todayVisits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation manuelle */}
      <Card className="rounded-2xl shadow-lg border border-muted/40 p-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Validation Manuelle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-4">
          <Input
            placeholder="Code utilisateur (8 caractères)"
            value={userCodeToValidate}
            onChange={e => setUserCodeToValidate(e.target.value.toUpperCase())}
            maxLength={8}
            className="flex-1 rounded-xl"
          />

          <Button
            onClick={handleValidateVisit}
            disabled={validating || userCodeToValidate.length !== 8}
            className="rounded-xl"
          >
            {validating ? "Validation..." : "Valider"}
          </Button>
        </CardContent>
      </Card>

      {/* Scanner */}
      <Card className="rounded-2xl shadow-lg border border-muted/40 p-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Validation par QR Code</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6">
          {!scanning && (
            <Button
              onClick={() => { setScanning(true); setScanResult(null); }}
              className="rounded-xl flex items-center gap-2"
            >
              <Camera className="w-5 h-5" /> Lancer la caméra
            </Button>
          )}

          {scanning && (
            <>
              <QrScanner
                delay={300}
                style={previewStyle}
                onError={handleError}
                onScan={handleScan}
              />

              <Button
                variant="outline"
                onClick={() => setScanning(false)}
                className="rounded-xl flex items-center gap-2"
              >
                <StopCircle className="w-5 h-5" /> Arrêter
              </Button>
            </>
          )}

          {scanResult && (
            <p className="text-green-600 font-medium">Code scanné : {scanResult}</p>
          )}
        </CardContent>
      </Card>

      {/* Filtres */}
      <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Recherche utilisateur"
          value={searchUser}
          onChange={e => setSearchUser(e.target.value)}
          className="rounded-xl max-w-xs"
        />

        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-xl" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-xl" />

        <Button type="submit" className="rounded-xl flex items-center gap-2">
          <Search className="w-5 h-5" /> Filtrer
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="rounded-xl flex items-center gap-2"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Exporter
        </Button>
      </form>

      {/* Tableau */}
      <Card className="rounded-2xl shadow-lg border border-muted/40 p-4 max-h-[440px] overflow-auto">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Historique des visites</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin w-10 h-10" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredVisits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                        Aucune visite trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVisits.map(visit => (
                      <TableRow key={visit.id} className="hover:bg-muted/10">
                        <TableCell>{visit.id}</TableCell>
                        <TableCell>{visit.name} ({visit.user_id})</TableCell>
                        <TableCell>{visit.phone || "-"}</TableCell>
                        <TableCell>{visit.visit_date ? new Date(visit.visit_date).toLocaleString() : "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
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