import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { getAllOrders, updateOrderStatus } from '@/lib/api';
import type { Order } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle, Clock, Eye, Loader2, Package, RefreshCw,
  Search, TrendingUp, Truck, XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { filterOrders(); }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(term)
        || o.shippingAddress?.name?.toLowerCase().includes(term)
        || o.shippingAddress?.phone?.includes(term));
    }
    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (id: string, status: Order['status']) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(id, status);
      toast.success('Statut mis à jour');
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, any> = {
      pending:   { label: 'En attente',  variant: 'secondary', icon: Clock },
      processing:{ label: 'En traitement',variant: 'default',  icon: RefreshCw },
      shipped:   { label: 'Expédiée',    variant: 'default',  icon: Truck },
      delivered: { label: 'Livrée',      variant: 'default',  icon: CheckCircle },
      cancelled: { label: 'Annulée',     variant: 'destructive', icon: XCircle },
    };
    const statusConf = map[status] || map.pending;
    const Icon = statusConf.icon;
    return (
      <Badge variant={statusConf.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {statusConf.label}
      </Badge>
    );
  };

  const stats = (() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.finalTotal ?? o.total ?? 0), 0);
    return { total, pending, processing, delivered, totalRevenue };
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête + stats */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des commandes</h1>
          <p className="text-muted-foreground mt-1">{stats.total} commande(s) au total</p>
        </div>
        <Button onClick={loadOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.pending}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">En traitement</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.processing}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Livrées</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.delivered}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Revenu total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{stats.totalRevenue.toFixed(2)} DH</div></CardContent></Card>
      </div>
      {/* Filtres */}
      <Card><CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par ID, nom ou téléphone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrer par statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">En traitement</SelectItem>
              <SelectItem value="shipped">Expédiée</SelectItem>
              <SelectItem value="delivered">Livrée</SelectItem>
              <SelectItem value="cancelled">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>
      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Articles</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.shippingAddress?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{order.shippingAddress?.phone || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? (
                          <span className="text-sm">
                            {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        ) : ('N/A')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.items?.length || 0} article(s)</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{(order.finalTotal ?? order.total ?? 0).toFixed(2)} DH</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" /> Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Dialog détail */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>
              Commande #{selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Infos client */}
              <div>
                <h3 className="font-semibold mb-3">Informations client</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground">Nom</p><p className="font-medium">{selectedOrder.shippingAddress?.name}</p></div>
                  <div><p className="text-muted-foreground">Téléphone</p><p className="font-medium">{selectedOrder.shippingAddress?.phone}</p></div>
                  <div className="col-span-2"><p className="text-muted-foreground">Adresse de livraison</p><p className="font-medium">{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</p></div>
                </div>
              </div>
              <Separator />
              {/* Articles commandés */}
              <div>
                <h3 className="font-semibold mb-3">Articles commandés</h3>
                <div className="space-y-3">
                 {selectedOrder.items?.map((item, index) => (
  <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
    <div className="rounded-lg bg-white p-2 flex-shrink-0">
      <Package className="h-8 w-8 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      {/* ✅ AFFICHAGE GARANTI */}
      <p className="font-medium text-base mb-1">{item.productName || item.name || 'Produit'}</p>
      <p className="text-sm text-muted-foreground">
        Quantité: {item.quantity} × {(item.price || 0).toFixed(2)} DH
      </p>
    </div>
    <p className="font-semibold whitespace-nowrap">
      {((item.price || 0) * item.quantity).toFixed(2)} DH
    </p>
  </div>
))}

                </div>
              </div>
              <Separator />
              {/* Total */}
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {(selectedOrder.finalTotal ?? selectedOrder.total ?? 0).toFixed(2)} DH
                </span>
              </div>
              <Separator />
              {/* Changer le statut */}
              <div>
                <h3 className="font-semibold mb-3">Changer le statut</h3>
                <div className="flex gap-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={value => handleStatusChange(selectedOrder.id, value as Order['status'])}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="processing">En traitement</SelectItem>
                      <SelectItem value="shipped">Expédiée</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && (<Loader2 className="h-8 w-8 animate-spin text-primary" />)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
