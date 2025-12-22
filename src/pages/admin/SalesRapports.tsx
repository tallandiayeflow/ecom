"use client";

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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { facturesAPI } from "@/lib/api";
import type { SalesReport } from "@/types/invoices.ts";
import { motion } from "framer-motion";
import {
    ArrowDown,
    ArrowUp,
    Calendar,
    Download,
    FileText,
    Loader2,
    Package,
    Receipt,
    RefreshCw,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const SalesReports = () => {
  // États
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [report, setReport] = useState<SalesReport | null>(null);

  // Filtres
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useCustomDates, setUseCustomDates] = useState(false);

  useEffect(() => {
    loadReport();
  }, [period, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (useCustomDates && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        params.period = period;
      }

      const data = await facturesAPI.getSalesReport(params);
      setReport(data);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Erreur lors du chargement du rapport";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const params: any = {};

      if (useCustomDates && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        params.period = period;
      }

      toast.loading("Génération du rapport PDF...", { id: "pdf-download" });
      await facturesAPI.downloadReportPdf(params);
      toast.success("Rapport téléchargé avec succès ! 📊", { id: "pdf-download" });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Erreur lors du téléchargement";
      toast.error(errorMsg, { id: "pdf-download" });
    } finally {
      setDownloading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("fr-FR") + " FCFA";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPeriodLabel = () => {
    if (useCustomDates && startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    switch (period) {
      case "day": return "Aujourd'hui";
      case "week": return "Cette semaine";
      case "month": return "Ce mois";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Aucune donnée disponible</h2>
        <p className="text-muted-foreground">Essayez de sélectionner une autre période</p>
        <Button onClick={loadReport} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>
    );
  }

  const stats = report.statistics;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            Rapports de Ventes
          </h1>
          <p className="text-muted-foreground mt-1">
            Période : {getPeriodLabel()}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={loadReport} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Téléchargement...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
          <CardDescription>Sélectionnez la période du rapport</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={useCustomDates ? "custom" : "preset"}
            onValueChange={(v) => setUseCustomDates(v === "custom")}
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="preset">Période prédéfinie</TabsTrigger>
              <TabsTrigger value="custom">Dates personnalisées</TabsTrigger>
            </TabsList>

            <TabsContent value="preset" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={period === "day" ? "default" : "outline"}
                  onClick={() => setPeriod("day")}
                  className="h-20"
                >
                  <div className="text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1" />
                    <div className="font-semibold">Aujourd'hui</div>
                    <div className="text-xs opacity-70">Ventes du jour</div>
                  </div>
                </Button>
                <Button
                  variant={period === "week" ? "default" : "outline"}
                  onClick={() => setPeriod("week")}
                  className="h-20"
                >
                  <div className="text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1" />
                    <div className="font-semibold">Cette semaine</div>
                    <div className="text-xs opacity-70">7 derniers jours</div>
                  </div>
                </Button>
                <Button
                  variant={period === "month" ? "default" : "outline"}
                  onClick={() => setPeriod("month")}
                  className="h-20"
                >
                  <div className="text-center">
                    <Calendar className="h-5 w-5 mx-auto mb-1" />
                    <div className="font-semibold">Ce mois</div>
                    <div className="text-xs opacity-70">30 derniers jours</div>
                  </div>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-blue-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
              <Receipt className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {stats.total_invoices}
              </div>
              <p className="text-xs text-muted-foreground">
                Factures émises
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {formatCurrency(stats.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                HT: {formatCurrency(stats.total_ht)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-purple-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TVA Collectée</CardTitle>
              <ArrowUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                {formatCurrency(stats.total_tax)}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxes sur ventes
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-orange-500/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {formatCurrency(stats.average_invoice)}
              </div>
              <p className="text-xs text-muted-foreground">
                Par facture
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Remises */}
      {stats.total_discounts > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Remises accordées</CardTitle>
              </div>
              <Badge variant="destructive" className="text-base">
                -{formatCurrency(stats.total_discounts)}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ventes quotidiennes */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ventes par jour
            </CardTitle>
            <CardDescription>
              Évolution des ventes sur la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.daily_sales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune vente enregistrée
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {report.daily_sales.map((sale, index) => (
                  <motion.div
                    key={sale.date}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{formatDate(sale.date)}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.invoices_count} facture(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {formatCurrency(sale.revenue)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produits les plus vendus */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Produits
            </CardTitle>
            <CardDescription>
              Les produits les plus vendus
            </CardDescription>
          </CardHeader>
          <CardContent>
            {report.top_products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun produit vendu
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {report.top_products.map((product, index) => (
                  <motion.div
                    key={product.product_name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold line-clamp-1">
                          {product.product_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity_sold} vendu(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-bold text-primary">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Résumé détaillé */}
      <Card className="border-primary/10">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <CardTitle className="text-xl">Résumé Financier</CardTitle>
          <CardDescription>
            Détail des montants de la période {getPeriodLabel()}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">Montant Hors Taxes (HT)</span>
              <span className="font-bold text-lg">{formatCurrency(stats.total_ht)}</span>
            </div>

            {stats.total_discounts > 0 && (
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-red-600 flex items-center gap-2">
                  <ArrowDown className="h-4 w-4" />
                  Remises accordées
                </span>
                <span className="font-bold text-lg text-red-600">
                  -{formatCurrency(stats.total_discounts)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-muted-foreground">TVA collectée</span>
              <span className="font-bold text-lg">{formatCurrency(stats.total_tax)}</span>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center py-4 bg-gradient-to-br from-primary/10 to-primary/5 px-6 rounded-lg">
              <span className="font-bold text-xl">Total TTC</span>
              <span className="font-bold text-3xl text-primary">
                {formatCurrency(stats.total_revenue)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Nombre de factures</p>
                <p className="text-2xl font-bold">{stats.total_invoices}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Panier moyen</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.average_invoice)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesReports;