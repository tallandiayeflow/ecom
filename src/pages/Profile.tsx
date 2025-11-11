import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Phone, Mail, Award, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { mockData } from '@/lib/mockData';
import { format } from 'date-fns';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });

  const userOrders = mockData.orders.filter(o => o.userId === user?.id);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profil mis à jour avec succès');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Mon Profil</h1>
            <p className="text-muted-foreground mt-1">Gérez vos informations personnelles</p>
          </div>

          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="orders">Commandes</TabsTrigger>
              <TabsTrigger value="loyalty">Fidélité</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Mettez à jour vos informations</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          <User className="inline h-4 w-4 mr-2" />
                          Nom complet
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail className="inline h-4 w-4 mr-2" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="inline h-4 w-4 mr-2" />
                          Téléphone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">
                          <MapPin className="inline h-4 w-4 mr-2" />
                          Ville
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="submit" className="flex-1">
                        Enregistrer les modifications
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleLogout}
                        className="flex-1 sm:flex-none"
                      >
                        Se déconnecter
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique des commandes</CardTitle>
                  <CardDescription>
                    Vous avez {userOrders.length} commande(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="mx-auto h-12 w-12 mb-3 opacity-50" />
                      <p>Aucune commande pour le moment</p>
                    </div>
                  ) : (
                    userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">Commande #{order.id.slice(-8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.createdAt), 'dd/MM/yyyy à HH:mm')}
                            </p>
                          </div>
                          <Badge
                            variant={
                              order.status === 'delivered'
                                ? 'default'
                                : order.status === 'cancelled'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {order.status === 'pending' && 'En attente'}
                            {order.status === 'processing' && 'En préparation'}
                            {order.status === 'shipped' && 'Expédiée'}
                            {order.status === 'delivered' && 'Livrée'}
                            {order.status === 'cancelled' && 'Annulée'}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center">
                          <p className="text-sm">
                            {order.items.length} article(s)
                          </p>
                          <p className="font-bold text-primary">{order.finalTotal.toFixed(2)} DH</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="loyalty" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Programme de fidélité</CardTitle>
                  <CardDescription>Cumulez des points et économisez</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <Award className="mx-auto h-16 w-16 text-primary mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Vos points de fidélité</p>
                    <p className="text-5xl font-bold text-primary">{user.loyaltyPoints}</p>
                    <p className="text-sm text-muted-foreground mt-2">points disponibles</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Comment ça marche ?</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">1</span>
                        </div>
                        <div>
                          <p className="font-medium">Gagnez des points</p>
                          <p className="text-sm text-muted-foreground">
                            1 DH dépensé = 1 point gagné
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">2</span>
                        </div>
                        <div>
                          <p className="font-medium">Convertissez vos points</p>
                          <p className="text-sm text-muted-foreground">
                            100 points = 10 DH de réduction
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-bold">3</span>
                        </div>
                        <div>
                          <p className="font-medium">Économisez sur vos achats</p>
                          <p className="text-sm text-muted-foreground">
                            Utilisez vos points lors du paiement
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
