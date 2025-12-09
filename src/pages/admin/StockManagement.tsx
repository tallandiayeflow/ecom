"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CreateStockMovementRequest, InventoryItem, stock, StockAlerts,
  StockMovement,
  StockStats
} from "@/lib/api";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { AlertTriangle, Edit, Loader2, Minus, Plus, RefreshCw } from "lucide-react";

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

  // Dialogue ajustement stock
  const [adjustStockDialog, setAdjustStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'in'|'out'|'return'|'adjustment'>('in');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chargement des données
  const fetchAllStockData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, alertsData, inventoryData, movementsData] = await Promise.all([
        stock.getStats(),
        stock.getAlerts(),
        stock.getInventory({ page: 1, limit: 100 }),
        stock.getMovements({ page: 1, limit: 50 }),
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
    toast.success("Données actualisées");
  };

  const openAdjustDialog = (product: InventoryItem, type: 'in'|'out'|'return'|'adjustment'='in') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
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
      toast.success(result.message);
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

  const getStockStatusLabel = (status: InventoryItem['stockStatus']) => {
    switch (status) {
      case 'good_stock': return 'Bon stock';
      case 'medium_stock': return 'Stock moyen';
      case 'low_stock': return 'Stock faible';
      case 'out_of_stock': return 'Rupture';
      default: return status;
    }
  };

  const getStockStatusVariant = (status: InventoryItem['stockStatus']) => {
    switch (status) {
      case 'good_stock': return 'default';
      case 'medium_stock': return 'secondary';
      case 'low_stock':
      case 'out_of_stock': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) return (
    <div className="text-center py-20">
      <Loader2 className="mx-auto animate-spin w-12 h-12 mb-4" />
      Chargement des données...
    </div>
  );

  if (error) return (
    <Alert variant="destructive" className="m-8 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertDescription>{error}</AlertDescription>
      </div>
      <Button variant="outline" onClick={fetchAllStockData}>Réessayer</Button>
    </Alert>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          {refreshing ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <RefreshCw className="w-5 h-5 mr-2" />}
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardHeader><CardTitle>Total Produits</CardTitle></CardHeader>
          <CardContent>{stats.totalProducts.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stock Total</CardTitle></CardHeader>
          <CardContent>{stats.totalStock.toLocaleString()} unités</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stock Faible</CardTitle></CardHeader>
          <CardContent>{stats.lowStockCount.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ruptures</CardTitle></CardHeader>
          <CardContent>{stats.outOfStockCount.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Valeur Stock</CardTitle></CardHeader>
          <CardContent>{stats.totalStockValue.toLocaleString('fr-FR')} DH</CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {(alerts.lowStockCount > 0 || alerts.outOfStockCount > 0) && (
        <Alert variant="destructive" className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {alerts.lowStockCount + alerts.outOfStockCount} alertes de stock
        </Alert>
      )}

      {/* Inventaire */}
      <Card>
        <CardHeader><CardTitle>Inventaire</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[500px]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6">Aucun produit</TableCell>
                  </TableRow>
                )}
                {inventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.price.toFixed(2)} DH</TableCell>
                    <TableCell>{item.stockValue.toFixed(2)} DH</TableCell>
                    <TableCell>
                      <Badge variant={getStockStatusVariant(item.stockStatus)}>
                        {getStockStatusLabel(item.stockStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" onClick={() => openAdjustDialog(item,'in')}><Plus className="inline w-4 h-4 mr-1"/>Ajouter</Button>
                      <Button size="sm" onClick={() => openAdjustDialog(item,'out')}><Minus className="inline w-4 h-4 mr-1"/>Retirer</Button>
                      <Button size="sm" onClick={() => openAdjustDialog(item,'adjustment')}><Edit className="inline w-4 h-4 mr-1"/>Ajuster</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Mouvements */}
      <Card>
        <CardHeader><CardTitle>Mouvements</CardTitle></CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Avant</TableHead>
                  <TableHead>Après</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Utilisateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">Aucun mouvement</TableCell>
                  </TableRow>
                )}
                {movements.map((mov) => (
                  <TableRow key={mov.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <TableCell>{new Date(mov.createdAt).toLocaleString('fr-FR')}</TableCell>
                    <TableCell>{mov.productName}</TableCell>
                    <TableCell>{mov.type}</TableCell>
                    <TableCell>{mov.quantity}</TableCell>
                    <TableCell>{mov.previousStock}</TableCell>
                    <TableCell>{mov.newStock}</TableCell>
                    <TableCell>{mov.reason || "-"}</TableCell>
                    <TableCell>{mov.user}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Dialog Ajustement Stock */}
      <Dialog open={adjustStockDialog} onOpenChange={setAdjustStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType==='in'?'Ajouter':adjustmentType==='out'?'Retirer':'Ajuster'} - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Label>Type d'ajustement</Label>
            <Select value={adjustmentType} onValueChange={(v)=>setAdjustmentType(v as any)}>
              <SelectTrigger>{adjustmentType==='in'?'Ajouter':adjustmentType==='out'?'Retirer':adjustmentType==='return'?'Retour':'Ajustement'}</SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Ajouter</SelectItem>
                <SelectItem value="out">Retirer</SelectItem>
                <SelectItem value="return">Retour</SelectItem>
                <SelectItem value="adjustment">Ajustement</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input type="number" min={1} value={adjustmentQuantity} onChange={(e)=>setAdjustmentQuantity(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Raison</Label>
              <Input value={adjustmentReason} onChange={(e)=>setAdjustmentReason(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSubmitAdjustment} disabled={!adjustmentQuantity || !adjustmentReason || submitting}>
              {submitting ? 'Traitement...' : 'Valider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockManagement;
