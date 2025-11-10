import { useEffect, useState } from 'react';
import { getAllOrders, getProducts, getAllUsers } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, Users, Euro, Zap, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

const Overview = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const orders = await getAllOrders();
      const { products } = await getProducts({ limit: 1000 });
      const users = await getAllUsers();

      const pendingOrders = orders.filter((o) => o.status === 'pending').length;
      const revenue = orders.reduce((sum, order) => sum + order.finalTotal, 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalProducts: products.length,
        totalUsers: users.length,
        revenue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Commandes totales',
      value: stats.totalOrders,
      icon: ShoppingBag,
      description: `${stats.pendingOrders} en attente`,
      color: 'text-primary',
    },
    {
      title: 'Produits',
      value: stats.totalProducts,
      icon: Package,
      description: 'Produits disponibles',
      color: 'text-primary',
    },
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      description: 'Comptes enregistrés',
      color: 'text-primary',
    },
    {
      title: 'Revenus',
      value: `${stats.revenue.toFixed(2)}€`,
      icon: Euro,
      description: 'Chiffre d\'affaires total',
      color: 'text-success',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de votre boutique</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={cn('h-5 w-5', stat.color)} />
              </CardHeader>
              <CardContent>
                <div className={cn('text-3xl font-bold mb-1', stat.color)}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Nouvelle commande</p>
                  <p className="text-sm text-muted-foreground">Il y a 5 minutes</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Nouvel utilisateur inscrit</p>
                  <p className="text-sm text-muted-foreground">Il y a 1 heure</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Zap className="mr-2 h-4 w-4" />
              Créer une vente flash
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Ticket className="mr-2 h-4 w-4" />
              Générer un bon d'achat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
