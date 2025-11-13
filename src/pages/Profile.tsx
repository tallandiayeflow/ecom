import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogHeader } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInfo, getUserOrders, updateUserProfile } from '@/lib/api';
import type { Order } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Award, Loader2, Mail, Package, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loyaltyPoints,setloyaltyPoints] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserInfo();
    loadUserOrders();
  }, [user]);

  const loadUserInfo = async () => {
    try {
      const data = await getUserInfo();
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',

      });
      setloyaltyPoints(data.loyaltyPoints)
    } catch {
      toast.error('Erreur lors du chargement du profil');
    }
  };

  const loadUserOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch {
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateUserProfile(formData);
      toast.success('Profil mis à jour');
      await refreshUser();
    } catch {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Mon Profil</h1>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid grid-cols-3 gap-4">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="loyalty">Fidélité</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Mettez à jour vos informations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name"><User className="inline h-4 w-4 mr-2" />Nom complet</Label>
                      <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="email"><Mail className="inline h-4 w-4 mr-2" />Email</Label>
                      <Input id="email" type="email" value={formData.email} disabled />
                    </div>
                    <div>
                      <Label htmlFor="phone"><Phone className="inline h-4 w-4 mr-2" />Téléphone</Label>
                      <Input id="phone" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                    </div>

                    <div >
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button type="submit" disabled={updating}>
                      {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
                    </Button>
                    <Button onClick={handleLogout}>Se déconnecter</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique des commandes</CardTitle>
                <CardDescription>Vous avez {orders.length} commande(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground">Aucune commande trouvée</p>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="border p-4 rounded mb-3 cursor-pointer hover:bg-accent/20" onClick={() => setSelectedOrder(order)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Commande #{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                        </div>
                        <div className="text-primary font-semibold">{(order.finalTotal ?? order.total).toFixed(2)} DH</div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty" className="p-4">
            <Card>
              <CardHeader>
                <CardTitle>Programme de fidélité</CardTitle>
                <CardDescription>Cumulez des points et économisez</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 rounded bg-gradient-to-br from-primary/10 to-primary/5">
                  <Award className="h-16 w-16 text-primary mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Vos points de fidélité</p>
                  <p className="text-5xl font-bold text-primary">{loyaltyPoints}</p>
                  <p className="text-sm text-muted-foreground mt-2">points disponibles</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Partie Historique des commandes */}
        <Tabs>
          <TabsContent value="orders" className="p-4">
  <Card>
    <CardHeader>
      <CardTitle>Historique des commandes</CardTitle>
      <CardDescription>Vous avez {orders.length} commande(s)</CardDescription>
    </CardHeader>
    <CardContent>
      {loadingOrders ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground">Aucune commande trouvée</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full border rounded-lg p-4 flex justify-between items-center hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary transition"
              aria-label={`Voir détails commande ${order.id.substring(0, 8)}`}
            >
              <div>
                <p className="font-semibold">Commande #{order.id.substring(0, 8)}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              <div>
                <Badge
                  variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'cancelled' ? 'secondary' : 'outline'
                  }
                >
                  {order.status === 'pending' && 'En attente'}
                  {order.status === 'processing' && 'En préparation'}
                  {order.status === 'shipped' && 'Expédiée'}
                  {order.status === 'delivered' && 'Livrée'}
                  {order.status === 'cancelled' && 'Annulée'}
                </Badge>
                <p className="font-bold text-primary mt-1 text-right">
                  {(order.finalTotal ?? order.total).toFixed(2)} DH
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
        </Tabs>

{/* Dialog détails commande */}
<Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Détails de la commande</DialogTitle>
      <DialogDescription>Commande #{selectedOrder?.id.substring(0, 8)}</DialogDescription>
    </DialogHeader>
    {selectedOrder && (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Informations client</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nom</p>
              <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Téléphone</p>
              <p className="font-medium">{selectedOrder.shippingAddress?.phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Adresse de livraison</p>
              <p className="font-medium">{selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</p>
            </div>
          </div>
        </div>
        <Separator />
        <div>
          <h3 className="font-semibold mb-3">Articles commandés</h3>
          <div className="space-y-3">
            {selectedOrder.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="rounded-lg bg-white p-2 flex-shrink-0">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base mb-1">{item.name}</p>
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
      </div>
    )}
  </DialogContent>
</Dialog>

      </div>
    </div>
  );
};

export default Profile;
