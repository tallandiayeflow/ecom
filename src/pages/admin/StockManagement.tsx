import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateStockMovementRequest,
  InventoryItem,
  StockAlerts,
  StockMovement,
  StockStats,
} from '@/lib/api';
import { factures, stock } from '@/lib/api';
import {
  CreateInvoiceData,
  InvoiceItem,
} from '@/types/invoices';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp, Check, Edit,
  FileText,
  Loader2,
  Minus,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Undo2,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Interface pour les items sélectionnés dans la facture
interface SelectedInvoiceItem extends InvoiceItem {
  product: InventoryItem;
}

const StockManagement = () => {
  // États pour les données de stock
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlerts>({
    lowStockCount: 0,
    outOfStockCount: 0,
    alerts: [],
  });
  const [stats, setStats] = useState<StockStats>({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockValue: 0,
  });

  // États pour UI générale
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // États pour ajustement de stock
  const [adjustStockDialog, setAdjustStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // États pour les factures
  const [createInvoiceDialog, setCreateInvoiceDialog] = useState(false);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<Map<string, SelectedInvoiceItem>>(new Map());
  const [invoice_number, setinvoice_number] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'pending' | 'paid' | 'cancelled'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card' | 'bank_transfer' | 'other'>('cash_on_delivery');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [taxRate, setTaxRate] = useState('20'); // 20% TVA par défaut
  const [discount, setDiscount] = useState('0');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Charger toutes les données
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
      console.error('Error fetching stock data:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des données');
      toast.error('Impossible de charger les données de stock');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllStockData();
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  useEffect(() => {
    fetchAllStockData();
  }, []);

  // Fonctions d'ajustement de stock
  const openAdjustDialog = (product: InventoryItem, type: 'in' | 'out' | 'adjustment') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setAdjustStockDialog(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || !adjustmentReason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La quantité doit être un nombre positif');
      return;
    }

    setSubmitting(true);

    try {
      const movementData: CreateStockMovementRequest = {
        productId: selectedProduct.id,
        type: adjustmentType,
        quantity: quantity,
        reason: adjustmentReason,
      };

      const result = await stock.createMovement(movementData);
      toast.success(result.message);
      setAdjustStockDialog(false);
      setSelectedProduct(null);
      await fetchAllStockData();
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      toast.error(err.response?.data?.error || "Erreur lors de l'ajustement du stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Fonctions de gestion des factures
  const generateinvoice_number = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const openCreateInvoiceDialog = () => {
    setSelectedInvoiceItems(new Map());
    setinvoice_number(generateinvoice_number());
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerCity('');
    setInvoiceStatus('pending');
    setPaymentMethod('cash_on_delivery');
    setInvoiceNotes('');
    setTaxRate('20');
    setDiscount('0');
    setCreateInvoiceDialog(true);
  };

  const addProductToInvoice = (product: InventoryItem) => {
    const newMap = new Map(selectedInvoiceItems);

    if (newMap.has(product.id)) {
      const item = newMap.get(product.id)!;
      if (item.quantity < product.stock) {
        item.quantity += 1;
        item.total = item.quantity * item.unitPrice;
        newMap.set(product.id, item);
      } else {
        toast.error('Stock insuffisant');
        return;
      }
    } else {
      const newItem: SelectedInvoiceItem = {
        id: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        productId: product.id,
        productImage: product.imageUrl,
        total: product.price,
        product: product,
      };
      newMap.set(product.id, newItem);
    }

    setSelectedInvoiceItems(newMap);
  };

  const removeProductFromInvoice = (productId: string) => {
    const newMap = new Map(selectedInvoiceItems);
    newMap.delete(productId);
    setSelectedInvoiceItems(newMap);
  };

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    const newMap = new Map(selectedInvoiceItems);
    const item = newMap.get(productId);

    if (!item) return;

    if (newQuantity <= 0) {
      newMap.delete(productId);
    } else if (newQuantity <= item.product.stock) {
      item.quantity = newQuantity;
      item.total = item.quantity * item.unitPrice;
      newMap.set(productId, item);
    } else {
      toast.error(`Stock disponible: ${item.product.stock} unités`);
      return;
    }

    setSelectedInvoiceItems(newMap);
  };

  const calculateInvoiceTotals = () => {
    let amount = 0;
    selectedInvoiceItems.forEach((item) => {
      amount += item.total || 0;
    });

    const discountAmount = parseFloat(discount) || 0;
    const amountAfterDiscount = Math.max(0, amount - discountAmount);

    const taxRateValue = parseFloat(taxRate) || 0;
    const taxAmount = (amountAfterDiscount * taxRateValue) / 100;

    const total = amountAfterDiscount + taxAmount;

    return {
      amount,
      discount: discountAmount,
      tax: taxAmount,
      total,
    };
  };

  const handleCreateInvoice = async () => {
    // Validations
    if (!customerName.trim()) {
      toast.error('Le nom du client est requis');
      return;
    }

    if (!customerEmail.trim()) {
      toast.error("L'email du client est requis");
      return;
    }

    if (selectedInvoiceItems.size === 0) {
      toast.error('Veuillez ajouter au moins un produit');
      return;
    }

    setCreatingInvoice(true);

    try {
      const items: InvoiceItem[] = Array.from(selectedInvoiceItems.values()).map((item) => ({
        id: item.id,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        productId: item.productId,
        productImage: item.productImage,
        total: item.total,
      }));

      const totals = calculateInvoiceTotals();

      const invoiceData: CreateInvoiceData = {
        invoice_number: invoice_number,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerCity: customerCity.trim() || undefined,
        items: items,
        status: invoiceStatus,
        paymentMethod: paymentMethod,
        notes: invoiceNotes.trim() || undefined,
        taxRate: parseFloat(taxRate) || 0,
        discount: totals.discount,
      };

      const result = await factures.createInvoice(invoiceData);

      toast.success('Facture créée avec succès !');
      setCreateInvoiceDialog(false);
      await fetchAllStockData();
      toast.info(`Facture N°${result.invoice_number} créée`);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      toast.error(err.response?.data?.error || 'Erreur lors de la création de la facture');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Fonctions utilitaires
  const getStockStatusColor = (status: InventoryItem['stockStatus']) => {
    switch (status) {
      case 'good_stock':
        return 'default';
      case 'medium_stock':
        return 'secondary';
      case 'low_stock':
        return 'destructive';
      case 'out_of_stock':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStockStatusLabel = (status: InventoryItem['stockStatus']) => {
    switch (status) {
      case 'good_stock':
        return 'Bon stock';
      case 'medium_stock':
        return 'Stock moyen';
      case 'low_stock':
        return 'Stock faible';
      case 'out_of_stock':
        return 'Rupture';
      default:
        return status;
    }
  };

  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'out':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'return':
        return <Undo2 className="h-4 w-4 text-blue-600" />;
      case 'adjustment':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementLabel = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return 'Entrée';
      case 'out':
        return 'Sortie';
      case 'return':
        return 'Retour';
      case 'adjustment':
        return 'Ajustement';
      default:
        return type;
    }
  };

  const getMovementTypeColor = (type: StockMovement['type']) => {
    switch (type) {
      case 'in':
        return 'text-green-600 bg-green-50';
      case 'out':
        return 'text-red-600 bg-red-50';
      case 'return':
        return 'text-blue-600 bg-blue-50';
      case 'adjustment':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchAllStockData} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  const { amount, discount: discountAmount, tax, total } = calculateInvoiceTotals();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion du Stock</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre inventaire, suivez les mouvements et créez des factures
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateInvoiceDialog} variant="default" size="sm">
            <Receipt className="h-4 w-4 mr-2" />
            Nouvelle Facture
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalStock.toLocaleString()} unités au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">Produits épuisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStockValue.toLocaleString('fr-FR')} DH
            </div>
            <p className="text-xs text-muted-foreground">Valeur totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de stock */}
      {(alerts.lowStockCount > 0 || alerts.outOfStockCount > 0) && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-semibold mb-2 text-yellow-800">
              ⚠️ {alerts.lowStockCount + alerts.outOfStockCount} Alertes Stock
            </div>
            {alerts.alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.alerts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-3 p-2 bg-white rounded">
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <span className="flex-1 font-medium text-sm">{product.name}</span>
                    <Badge variant="destructive" className="mr-2">
                      {product.stock} unités
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const item = inventory.find((i) => i.id === product.id);
                        if (item) openAdjustDialog(item, 'in');
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                ))}
                {alerts.alerts.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{alerts.alerts.length - 5} autres produits
                  </p>
                )}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventaire
          </TabsTrigger>
          <TabsTrigger value="movements">
            <FileText className="h-4 w-4 mr-2" />
            Mouvements
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <Receipt className="h-4 w-4 mr-2" />
            Factures
          </TabsTrigger>
        </TabsList>

        {/* Tab Inventaire */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventaire Complet</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
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
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Aucun produit en stock</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <span
                            className={
                              item.stock < 5
                                ? 'text-red-600 font-bold'
                                : item.stock < 10
                                ? 'text-yellow-600 font-semibold'
                                : 'font-medium'
                            }
                          >
                            {item.stock}
                          </span>
                        </TableCell>
                        <TableCell>{item.price.toFixed(2)} DH</TableCell>
                        <TableCell>{item.stockValue.toFixed(2)} DH</TableCell>
                        <TableCell>
                          <Badge variant={getStockStatusColor(item.stockStatus)}>
                            {getStockStatusLabel(item.stockStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjustDialog(item, 'in')}
                              title="Ajouter au stock"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjustDialog(item, 'out')}
                              title="Retirer du stock"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAdjustDialog(item, 'adjustment')}
                              title="Ajuster le stock"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Mouvements */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Mouvements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qté</TableHead>
                    <TableHead>Avant</TableHead>
                    <TableHead>Après</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground">Aucun mouvement de stock</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-xs">
                          {new Date(movement.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {movement.productImage && (
                              <img
                                src={movement.productImage}
                                alt={movement.productName}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <span className="text-sm">{movement.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getMovementTypeColor(
                              movement.type
                            )}`}
                          >
                            {getMovementIcon(movement.type)}
                            {getMovementLabel(movement.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              movement.type === 'in' || movement.type === 'return'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {movement.type === 'in' || movement.type === 'return' ? '+' : '-'}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.previousStock}</TableCell>
                        <TableCell className="font-semibold">{movement.newStock}</TableCell>
                        <TableCell className="text-sm">{movement.reason || '-'}</TableCell>
                        <TableCell className="text-sm">{movement.user}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Factures */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestion des Factures</CardTitle>
              <Button onClick={openCreateInvoiceDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une facture
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Cliquez sur "Créer une facture" pour générer une facture client
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de création de facture */}
      <Dialog open={createInvoiceDialog} onOpenChange={setCreateInvoiceDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Créer une Facture Client</DialogTitle>
            <DialogDescription>
              Numéro de facture: <strong>{invoice_number}</strong>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Informations client */}
              <div>
                <h3 className="font-semibold mb-3">Informations Client</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">
                      Nom du client <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerName"
                      placeholder="Ex: Mohamed Ali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="client@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Téléphone</Label>
                    <Input
                      id="customerPhone"
                      placeholder="+212 6XX XXX XXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerCity">Ville</Label>
                    <Input
                      id="customerCity"
                      placeholder="Ex: Casablanca"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="customerAddress">Adresse</Label>
                    <Input
                      id="customerAddress"
                      placeholder="Adresse complète"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Paramètres de facture */}
              <div>
                <h3 className="font-semibold mb-3">Paramètres de Facturation</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceStatus">Statut</Label>
                    <Select value={invoiceStatus} onValueChange={(v: any) => setInvoiceStatus(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Mode de paiement</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash_on_delivery">Paiement à la livraison</SelectItem>
                        <SelectItem value="card">Carte bancaire</SelectItem>
                        <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Produits sélectionnés */}
              <div>
                <h3 className="font-semibold mb-3">Produits sélectionnés</h3>

                {selectedInvoiceItems.size === 0 ? (
                  <Alert>
                    <ShoppingCart className="h-4 w-4" />
                    <AlertDescription>
                      Aucun produit sélectionné. Utilisez la liste ci-dessous pour ajouter des
                      produits.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix Unit.</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(selectedInvoiceItems.values()).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Stock: {item.product.stock}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.unitPrice.toFixed(2)} DH</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max={item.product.stock}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateProductQuantity(item.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {item.total?.toFixed(2)} DH
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProductFromInvoice(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Separator />

              {/* Liste des produits disponibles */}
              <div>
                <h3 className="font-semibold mb-3">Produits disponibles</h3>
                <ScrollArea className="h-64 border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory
                        .filter((p) => p.stock > 0)
                        .map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.imageUrl && (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <span className="text-sm">{product.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{product.price.toFixed(2)} DH</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addProductToInvoice(product)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <Separator />

              {/* Totaux et notes */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNotes">Notes</Label>
                    <Textarea
                      id="invoiceNotes"
                      placeholder="Notes supplémentaires pour la facture..."
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">TVA (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Remise (DH)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Montant:</span>
                    <span className="font-medium">{amount.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remise:</span>
                    <span className="font-medium text-red-600">
                      -{discountAmount.toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>TVA ({taxRate}%):</span>
                    <span className="font-medium">{tax.toFixed(2)} DH</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total TTC:</span>
                    <span className="text-primary">{total.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setCreateInvoiceDialog(false)}
              disabled={creatingInvoice}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
              {creatingInvoice ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Créer la facture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'ajustement de stock */}
      {/* Dialog de création de facture - VERSION OPTIMISÉE */}
<Dialog open={createInvoiceDialog} onOpenChange={setCreateInvoiceDialog}>
  <DialogContent className="max-w-6xl h-[95vh] p-0 gap-0">
    <DialogHeader className="px-6 pt-6 pb-4 border-b">
      <DialogTitle>Créer une Facture Client</DialogTitle>
      <DialogDescription>
        Numéro de facture: <strong className="text-primary">{invoice_number}</strong>
      </DialogDescription>
    </DialogHeader>

    {/* Container avec scroll optimisé */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="space-y-6 pb-4">
        {/* Section 1: Informations client */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="text-lg font-semibold">Informations Client</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nom du client <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="Ex: Mohamed Ali"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="client@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Téléphone</Label>
              <Input
                id="customerPhone"
                placeholder="+212 6XX XXX XXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerCity">Ville</Label>
              <Input
                id="customerCity"
                placeholder="Ex: Casablanca"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="customerAddress">Adresse</Label>
              <Input
                id="customerAddress"
                placeholder="Adresse complète"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 2: Paramètres de facture */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="text-lg font-semibold">Paramètres de Facturation</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoiceStatus">Statut</Label>
              <Select value={invoiceStatus} onValueChange={(v: any) => setInvoiceStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Mode de paiement</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_on_delivery">Paiement à la livraison</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Section 3: Produits sélectionnés */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="text-lg font-semibold">
              Produits sélectionnés ({selectedInvoiceItems.size})
            </h3>
          </div>

          {selectedInvoiceItems.size === 0 ? (
            <Alert>
              <ShoppingCart className="h-4 w-4" />
              <AlertDescription>
                Aucun produit sélectionné. Ajoutez des produits depuis la liste ci-dessous.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Produit</TableHead>
                      <TableHead className="min-w-[100px]">Prix Unit.</TableHead>
                      <TableHead className="min-w-[150px]">Quantité</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(selectedInvoiceItems.values()).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.name}
                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Stock: {item.product.stock}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.unitPrice.toFixed(2)} DH</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => updateProductQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) =>
                                updateProductQuantity(item.id, parseInt(e.target.value) || 1)
                              }
                              className="w-16 text-center h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => updateProductQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {item.total?.toFixed(2)} DH
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => removeProductFromInvoice(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Section 4: Ajouter des produits */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="text-lg font-semibold">Ajouter des produits</h3>
          </div>
          <div className="border rounded-lg">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[200px]">Produit</TableHead>
                    <TableHead className="min-w-[100px]">Prix</TableHead>
                    <TableHead className="min-w-[80px]">Stock</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory
                    .filter((p) => p.stock > 0)
                    .map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-8 h-8 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm truncate">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {product.price.toFixed(2)} DH
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.stock < 10 ? 'destructive' : 'secondary'}
                            className="font-mono"
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addProductToInvoice(product)}
                            disabled={selectedInvoiceItems.has(product.id)}
                          >
                            {selectedInvoiceItems.has(product.id) ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Ajouté
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <Separator />

        {/* Section 5: Calculs et notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="text-lg font-semibold">Calculs et Notes</h3>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Notes */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNotes">Notes</Label>
                <Textarea
                  id="invoiceNotes"
                  placeholder="Notes supplémentaires..."
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">TVA (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Remise (DH)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Résumé des totaux */}
            <div>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg p-6 space-y-3 sticky top-0">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Montant HT:</span>
                  <span className="font-semibold text-lg">{amount.toFixed(2)} DH</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Remise:</span>
                    <span className="font-semibold text-red-600">
                      -{discountAmount.toFixed(2)} DH
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">TVA ({taxRate}%):</span>
                  <span className="font-semibold">{tax.toFixed(2)} DH</span>
                </div>

                <Separator className="bg-primary/20" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total TTC:</span>
                  <span className="text-2xl font-bold text-primary">
                    {total.toFixed(2)} DH
                  </span>
                </div>

                <div className="text-xs text-center text-muted-foreground mt-2">
                  {selectedInvoiceItems.size} produit(s) sélectionné(s)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Footer fixe en bas */}
    <div className="border-t px-6 py-4 bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="text-sm text-muted-foreground">
          Facture N° <span className="font-mono font-semibold">{invoice_number}</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setCreateInvoiceDialog(false)}
            disabled={creatingInvoice}
            className="flex-1 sm:flex-none"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateInvoice}
            disabled={creatingInvoice || selectedInvoiceItems.size === 0}
            className="flex-1 sm:flex-none"
          >
            {creatingInvoice ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Création...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Créer la facture
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>

    </div>
  );
};

export default StockManagement;
