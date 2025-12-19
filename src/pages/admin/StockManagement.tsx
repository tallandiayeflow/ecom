"use client";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CreateStockMovementRequest,
  InventoryItem,
  stock,
  StockAlerts,
  StockMovement,
  StockStats,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  Box,
  CheckCircle,
  DollarSign,
  Edit,
  History,
  Loader2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  X,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const StockManagement = () => {
  // States globales
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockValue: 0,
  });
  const [alerts, setAlerts] = useState<StockAlerts>({
    lowStockCount: 0,
    outOfStockCount: 0,
    alerts: [],
  });
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchInventory, setSearchInventory] = useState("");
  const [searchMovements, setSearchMovements] = useState("");

  // Dialogue ajustement stock
  const [adjustStockDialog, setAdjustStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out" | "return" | "adjustment">(
    "in"
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Chargement des données
  const fetchAllStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, alertsData, inventoryData, movementsData] = await Promise.all([
        stock.getStats(),
        stock.getAlerts(),
        stock.getInventory({ page: 1, limit: 1000 }),
        stock.getMovements({ page: 1, limit: 500 }),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      setInventory(inventoryData.inventory);
      setMovements(movementsData.movements);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Erreur lors du chargement des données");
      toast.error("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStockData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllStockData();
    setRefreshing(false);
    toast.success("Données actualisées ! 🔄");
  };

  const openAdjustDialog = (
    product: InventoryItem,
    type: "in" | "out" | "return" | "adjustment" = "in"
  ) => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setAdjustStockDialog(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || !adjustmentReason) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("La quantité doit être un nombre positif");
      return;
    }
    setSubmitting(true);
    try {
      const movementData: CreateStockMovementRequest = {
        productId: selectedProduct.id,
        type: adjustmentType,
        quantity,
        reason: adjustmentReason,
      };
      const result = await stock.createMovement(movementData);
      toast.success(result.message || "Stock ajusté avec succès ! ✅");
      setAdjustStockDialog(false);
      setSelectedProduct(null);
      await fetchAllStockData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Erreur lors de l'ajustement du stock");
    } finally {
      setSubmitting(false);
    }
  };

  const getStockStatusLabel = (status: InventoryItem["stockStatus"]) => {
    switch (status) {
      case "good_stock":
        return "Bon stock";
      case "medium_stock":
        return "Stock moyen";
      case "low_stock":
        return "Stock faible";
      case "out_of_stock":
        return "Rupture";
      default:
        return status;
    }
  };

  const getStockStatusConfig = (status: InventoryItem["stockStatus"]) => {
    switch (status) {
      case "good_stock":
        return {
          variant: "default" as const,
          className: "bg-green-500/10 text-green-500 border-green-500/20",
          icon: CheckCircle,
        };
      case "medium_stock":
        return {
          variant: "secondary" as const,
          className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          icon: AlertCircle,
        };
      case "low_stock":
        return {
          variant: "destructive" as const,
          className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          icon: AlertTriangle,
        };
      case "out_of_stock":
        return {
          variant: "destructive" as const,
          className: "bg-red-500/10 text-red-500 border-red-500/20",
          icon: XCircle,
        };
      default:
        return {
          variant: "secondary" as const,
          className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
          icon: Package,
        };
    }
  };

  const getMovementTypeConfig = (type: string) => {
    switch (type) {
      case "in":
        return {
          label: "Entrée",
          icon: ArrowUpCircle,
          className: "bg-green-500/10 text-green-500 border-green-500/20",
        };
      case "out":
        return {
          label: "Sortie",
          icon: ArrowDownCircle,
          className: "bg-red-500/10 text-red-500 border-red-500/20",
        };
      case "return":
        return {
          label: "Retour",
          icon: Archive,
          className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        };
      case "adjustment":
        return {
          label: "Ajustement",
          icon: Edit,
          className: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        };
      default:
        return {
          label: type,
          icon: Package,
          className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
        };
    }
  };

  // Filtrage
  const filteredInventory = inventory.filter((item) => {
    if (!searchInventory) return true;
    const q = searchInventory.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q) ||
      String(item.id).toLowerCase().includes(q)
    );
  });

  const filteredMovements = movements.filter((mov) => {
    if (!searchMovements) return true;
    const q = searchMovements.toLowerCase();
    return (
      mov.productName?.toLowerCase().includes(q) ||
      mov.reason?.toLowerCase().includes(q) ||
      mov.user?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement des données de stock...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>{error}</AlertDescription>
          </div>
          <Button variant="outline" onClick={fetchAllStockData}>
            Réessayer
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Gestion des Stocks
          </h1>
          <p className="text-muted-foreground">
            Gérez votre inventaire et suivez les mouvements de stock
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          {refreshing ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Produits distincts</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <Box className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.totalStock.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unités en stock</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Stock épuisé</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.totalStockValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {(alerts.lowStockCount > 0 || alerts.outOfStockCount > 0) && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription className="font-semibold">
            {alerts.lowStockCount + alerts.outOfStockCount} alerte(s) de stock •{" "}
            {alerts.lowStockCount} stock faible • {alerts.outOfStockCount} rupture(s)
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Inventaire / Mouvements */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventaire ({filteredInventory.length})
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Mouvements ({filteredMovements.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Inventaire */}
        <TabsContent value="inventory" className="space-y-4">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    Inventaire
                  </CardTitle>
                  <CardDescription>
                    {filteredInventory.length} produit(s) • {stats.totalStock} unités
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, catégorie, ID..."
                  className="pl-10 h-11"
                  value={searchInventory}
                  onChange={(e) => setSearchInventory(e.target.value)}
                />
                {searchInventory && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchInventory("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden bg-card">
                {filteredInventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchInventory
                        ? "Aucun produit ne correspond à votre recherche"
                        : "Votre inventaire est vide"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b-2">
                          <TableHead className="font-semibold">Produit</TableHead>
                          <TableHead className="font-semibold">Catégorie</TableHead>
                          <TableHead className="font-semibold text-right">Stock</TableHead>
                          <TableHead className="font-semibold text-right">Prix</TableHead>
                          <TableHead className="font-semibold text-right">Valeur</TableHead>
                          <TableHead className="font-semibold text-center">Statut</TableHead>
                          <TableHead className="font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item, index) => {
                          const statusConfig = getStockStatusConfig(item.stockStatus);
                          const StatusIcon = statusConfig.icon;

                          return (
                            <motion.tr
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="group hover:bg-accent/50 transition-all duration-200 border-b"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      #{String(item.id).slice(0, 8)}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{item.category || "-"}</TableCell>
                              <TableCell className="text-right font-bold">
                                {item.stock.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.price.toLocaleString()} FCFA
                              </TableCell>
                              <TableCell className="text-right font-semibold text-primary">
                                {item.stockValue.toLocaleString()} FCFA
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge className={statusConfig.className}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {getStockStatusLabel(item.stockStatus)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAdjustDialog(item, "in")}
                                    className="hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAdjustDialog(item, "out")}
                                    className="hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openAdjustDialog(item, "adjustment")}
                                    className="hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/50"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Mouvements */}
        <TabsContent value="movements" className="space-y-4">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <History className="h-5 w-5 text-primary-foreground" />
                    </div>
                    Historique des Mouvements
                  </CardTitle>
                  <CardDescription>
                    {filteredMovements.length} mouvement(s) de stock
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit, raison, utilisateur..."
                  className="pl-10 h-11"
                  value={searchMovements}
                  onChange={(e) => setSearchMovements(e.target.value)}
                />
                {searchMovements && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchMovements("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden bg-card">
                {filteredMovements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                      <History className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aucun mouvement</h3>
                    <p className="text-muted-foreground max-w-md">
                      {searchMovements
                        ? "Aucun mouvement ne correspond à votre recherche"
                        : "Les mouvements de stock apparaîtront ici"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b-2">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Produit</TableHead>
                          <TableHead className="font-semibold text-center">Type</TableHead>
                          <TableHead className="font-semibold text-right">Quantité</TableHead>
                          <TableHead className="font-semibold text-right">Avant</TableHead>
                          <TableHead className="font-semibold text-right">Après</TableHead>
                          <TableHead className="font-semibold">Raison</TableHead>
                          <TableHead className="font-semibold">Utilisateur</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.map((mov, index) => {
                          const typeConfig = getMovementTypeConfig(mov.type);
                          const TypeIcon = typeConfig.icon;

                          return (
                            <motion.tr
                              key={mov.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="group hover:bg-accent/50 transition-all duration-200 border-b"
                            >
                              <TableCell className="text-sm">
                                {new Date(mov.createdAt).toLocaleString("fr-FR", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell className="font-medium">{mov.productName}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={typeConfig.className}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {typeConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {mov.quantity.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {mov.previousStock.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-primary">
                                {mov.newStock.toLocaleString()}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {mov.reason || "-"}
                              </TableCell>
                              <TableCell>{mov.user || "-"}</TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Ajustement Stock */}
      <Dialog open={adjustStockDialog} onOpenChange={setAdjustStockDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Ajuster le Stock
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.name} • Stock actuel: {selectedProduct?.stock} unités
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Type d'ajustement</Label>
              <Select
                value={adjustmentType}
                onValueChange={(v) => setAdjustmentType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-green-500" />
                      Entrée (Ajouter)
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      Sortie (Retirer)
                    </div>
                  </SelectItem>
                  <SelectItem value="return">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-blue-500" />
                      Retour
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4 text-purple-500" />
                      Ajustement
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(e.target.value)}
                placeholder="Entrez la quantité"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Raison *</Label>
              <Textarea
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="ex: Réapprovisionnement, vente, inventaire..."
                rows={3}
              />
            </div>

            {adjustmentQuantity && !isNaN(parseInt(adjustmentQuantity)) && (
              <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  📊 <strong>Nouveau stock:</strong>{" "}
                  {adjustmentType === "in"
                    ? (selectedProduct?.stock || 0) + parseInt(adjustmentQuantity)
                    : adjustmentType === "out"
                    ? Math.max(0, (selectedProduct?.stock || 0) - parseInt(adjustmentQuantity))
                    : selectedProduct?.stock || 0}{" "}
                  unités
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdjustStockDialog(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitAdjustment}
              disabled={!adjustmentQuantity || !adjustmentReason || submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valider
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;
