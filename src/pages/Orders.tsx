import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { getUserOrders } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft } from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      const data = await getUserOrders(user.id);
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
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

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mes Commandes</h1>
          <p className="text-muted-foreground">{orders.length} commande(s)</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">Vous n'avez pas encore de commandes</p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              Découvrir nos produits
            </Button>
          </div>
        ) : (
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

                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantité: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {(item.product.price * item.quantity).toFixed(2)}€
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
