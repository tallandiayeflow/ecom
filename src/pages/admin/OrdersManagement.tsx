import { useEffect, useState } from 'react';
import { Order } from '@/types';
import { getAllOrders, updateOrderStatus } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], { color: string; label: string }> = {
      pending: { color: 'bg-warning text-warning-foreground', label: 'En attente' },
      processing: { color: 'bg-primary text-primary-foreground', label: 'En traitement' },
      shipped: { color: 'bg-accent text-accent-foreground', label: 'Expédiée' },
      delivered: { color: 'bg-success text-success-foreground', label: 'Livrée' },
      cancelled: { color: 'bg-destructive text-destructive-foreground', label: 'Annulée' },
    };
    
    return <Badge className={variants[status].color}>{variants[status].label}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Gestion des Commandes</h1>
        <p className="text-muted-foreground">{orders.length} commande(s) au total</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">Commande #{order.id}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), 'PPP à p', { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{order.finalTotal.toFixed(2)}€</p>
                  <p className="text-sm text-muted-foreground">{order.items.length} article(s)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold mb-1">Client</p>
                  <p className="text-sm">{order.shippingAddress.name}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1">Adresse de livraison</p>
                  <p className="text-sm">{order.shippingAddress.address}</p>
                  <p className="text-sm text-muted-foreground">{order.shippingAddress.city}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Produits</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 text-sm">
                      <img src={item.product.images[0]} alt="" className="h-12 w-12 object-cover rounded" />
                      <span className="flex-1">{item.product.name}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                      <span className="font-semibold">{(item.product.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold">Changer le statut:</p>
                <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En traitement</SelectItem>
                    <SelectItem value="shipped">Expédiée</SelectItem>
                    <SelectItem value="delivered">Livrée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersManagement;
