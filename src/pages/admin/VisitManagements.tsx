"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Calendar,
  CheckCircle,
  Download,
  Eye,
  Filter,
  Loader2,
  QrCode,
  RefreshCw,
  Scan,
  TrendingUp,
  User,
  Users,
  X
} from "lucide-react";
import QrScanner from "qr-scanner";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Visit {
  id: string | number;
  user_id: string;
  name: string;
  phone?: string;
  visit_date: string;
  created_at?: string;
}

// Helper pour formater l'ID
const formatVisitId = (id: string | number): string => {
  const idStr = String(id);
  return idStr.length > 8 ? idStr.slice(0, 8) : idStr;
};

const QRCodeScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [userCodeToValidate, setUserCodeToValidate] = useState("");
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [validatedUser, setValidatedUser] = useState<string>("");

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const visitsData = await getVisits({
        user_id: searchUser || undefined,
        date_min: dateFrom || undefined,
        date_max: dateTo || undefined,
      });
      setVisits(visitsData);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des visites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

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
          preferredCamera: "environment",
        }
      );
      scannerRef.current.start().catch(() => {
        toast.error("Impossible d'accéder à la caméra");
        setScanning(false);
      });
    }

    return () => {
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [scanning]);

  const handleValidateScan = async (code: string) => {
    setValidating(true);
    try {
      const res = await validateVisitByCode({ user_code: code.toUpperCase() });
      toast.success(res.message || `Visite validée pour le code : ${code}`);
      setScanResult(code);
      setValidatedUser(code);
      setShowSuccessDialog(true);
      setUserCodeToValidate("");
      fetchVisits();
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.response?.data?.error || "Erreur lors de la validation de la visite";
      toast.error(errorMessage);
      setScanResult(null);
    } finally {
      setValidating(false);
    }
  };

  const handleValidateManual = async () => {
    if (userCodeToValidate.length !== 8) {
      toast.error("Le code utilisateur doit contenir 8 caractères");
      return;
    }
    await handleValidateScan(userCodeToValidate);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVisits();
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
      a.download = `visites_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export CSV téléchargé ! 📊");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchUser("");
    setDateFrom("");
    setDateTo("");
    fetchVisits();
  };

  // Stats
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: visits.length,
    today: visits.filter((v) => v.visit_date?.startsWith(today)).length,
    thisWeek: visits.filter((v) => {
      const visitDate = new Date(v.visit_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return visitDate >= weekAgo;
    }).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Scanner QR Code & Visites
        </h1>
        <p className="text-muted-foreground">
          Validez les visites en scannant les QR codes ou manuellement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visites</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Toutes périodes</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Visites du jour</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Section */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <CardTitle className="text-2xl flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Scan className="h-5 w-5 text-primary-foreground" />
            </div>
            Scanner QR Code
          </CardTitle>
          <CardDescription>
            Validez une visite en scannant le QR code du client
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {scanning ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-md mx-auto rounded-xl border-4 border-primary shadow-xl"
                  muted
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-primary rounded-xl animate-pulse pointer-events-none" />
              </div>

              {validating && (
                <div className="flex items-center justify-center gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                  <span className="text-blue-600 font-semibold">Validation en cours...</span>
                </div>
              )}

              <Button
                onClick={() => {
                  setScanning(false);
                  setScanResult(null);
                  setValidating(false);
                  scannerRef.current?.stop();
                }}
                variant="destructive"
                className="w-full max-w-md mx-auto block"
                size="lg"
              >
                <X className="mr-2 h-5 w-5" />
                Arrêter le scan
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Bouton démarrer scan */}
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setScanning(true);
                    setScanResult(null);
                    setValidating(false);
                  }}
                  size="lg"
                  className="px-8 py-6 text-lg"
                >
                  <QrCode className="mr-2 h-6 w-6" />
                  Démarrer le Scanner
                </Button>
              </div>

              {/* Validation manuelle */}
              <div className="p-6 bg-gradient-to-br from-muted/50 to-transparent rounded-xl border-2 border-dashed">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Validation Manuelle
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="userCode">Code Utilisateur (8 caractères)</Label>
                    <Input
                      id="userCode"
                      placeholder="ex: ABC12345"
                      value={userCodeToValidate}
                      onChange={(e) => setUserCodeToValidate(e.target.value.toUpperCase())}
                      maxLength={8}
                      className="font-mono text-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleValidateManual}
                      disabled={validating || userCodeToValidate.length !== 8}
                      className="w-full md:w-auto"
                      size="lg"
                    >
                      {validating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Validation...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Valider
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique des visites */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Eye className="h-5 w-5 text-primary-foreground" />
                </div>
                Historique des Visites
              </CardTitle>
              <CardDescription>
                {visits.length} visite(s) • {stats.today} aujourd'hui
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchVisits} variant="outline" size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
              <Button
                onClick={handleExport}
                disabled={exporting || visits.length === 0}
                variant="outline"
                size="sm"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter CSV
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Filtres */}
          <form onSubmit={handleFilterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchUser">
                  <User className="h-4 w-4 inline mr-1" />
                  Utilisateur
                </Label>
                <Input
                  id="searchUser"
                  placeholder="Nom ou ID..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFrom">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date début
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date fin
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrer
                </Button>
                {(searchUser || dateFrom || dateTo) && (
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune visite</h3>
                <p className="text-muted-foreground max-w-md">
                  {searchUser || dateFrom || dateTo
                    ? "Aucune visite ne correspond aux filtres"
                    : "Les visites apparaîtront ici après validation"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Utilisateur</TableHead>
                        <TableHead className="font-semibold">Code</TableHead>
                        <TableHead className="font-semibold">Téléphone</TableHead>
                        <TableHead className="font-semibold">Date de visite</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visits.map((visit, index) => (
                        <motion.tr
                          key={visit.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell className="font-mono text-xs">
                            {formatVisitId(visit.id)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{visit.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {visit.user_id}
                            </Badge>
                          </TableCell>
                          <TableCell>{visit.phone || "-"}</TableCell>
                          <TableCell>
                            {new Date(visit.visit_date).toLocaleString("fr-FR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500/10 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Validée
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {visits.map((visit, index) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">{visit.name}</p>
                                <Badge variant="outline" className="font-mono text-xs mt-1">
                                  {visit.user_id}
                                </Badge>
                              </div>
                            </div>
                            <Badge className="bg-green-500/10 text-green-500">Validée</Badge>
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">ID:</span>
                              <span className="font-mono">{formatVisitId(visit.id)}</span>
                            </div>
                            {visit.phone && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Téléphone:</span>
                                <span className="font-medium">{visit.phone}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium">
                                {new Date(visit.visit_date).toLocaleString("fr-FR", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog succès */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              Visite Validée !
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              La visite pour le code{" "}
              <span className="font-mono font-bold text-primary">{validatedUser}</span> a été
              enregistrée avec succès.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              Parfait !
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QRCodeScanner;
