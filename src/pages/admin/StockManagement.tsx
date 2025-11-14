import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  mockInventory,
  mockStockAlerts,
  mockStockMovements,
  mockStockStats,
} from '@/lib/mockInvoicesStock';
import { InventoryItem, StockMovement } from '@/types/invoices';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Package,
  TrendingUp,
  Undo2,
} from 'lucide-react';
import { useState } from 'react';

const StockManagement = () => {
  const [inventory] = useState<InventoryItem[]>(mockInventory);
  const [movements] = useState<StockMovement[]>(mockStockMovements);
  const [alerts] = useState(mockStockAlerts);
  const [stats] = useState(mockStockStats);

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

  const getMovementIcon = (type: StockMovement['movementType']) => {
    switch (type) {
      case 'in':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'out':
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      case 'return':
        return <Undo2 className="h-4 w-4 text-blue-600" />;
      case 'adjustment':
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementLabel = (type: StockMovement['movementType']) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion du Stock</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.general.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.general.totalStock} unités
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.general.lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Produits à réapprovisionner</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ruptures</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.general.outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Produits épuisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.general.totalStockValue.toLocaleString('fr-FR')} DH
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes de stock */}
      {(alerts.lowStockCount > 0 || alerts.outOfStockCount > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Alertes Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.lowStock.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2">Stock Faible:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {alerts.lowStock.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 bg-background rounded"
                    >
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.stock} unités
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

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
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Valeur Stock</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {item.stock}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.price.toFixed(2)} DH
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.stockValue.toFixed(2)} DH
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStockStatusColor(item.stockStatus)}>
                          {getStockStatusLabel(item.stockStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-center">Stock Avant</TableHead>
                    <TableHead className="text-center">Stock Après</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {movement.productImage && (
                            <img
                              src={movement.productImage}
                              alt={movement.productName || ''}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          <span className="text-sm">{movement.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movementType)}
                          <span className="text-sm">
                            {getMovementLabel(movement.movementType)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {movement.movementType === 'in' ||
                        movement.movementType === 'return'
                          ? '+'
                          : '-'}
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-center">
                        {movement.previousStock}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {movement.newStock}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {movement.reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{movement.userName}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;
