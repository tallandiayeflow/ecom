import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllOrders, getAllUsers, getProducts, getVisitsStats } from '@/lib/api';
import { Calendar, Package, ShoppingBag, Smartphone, Ticket, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenue: number;
  totalVisits: number;
  todayVisits: number;
}

const Overview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    revenue: 0,
    totalVisits: 0,
    todayVisits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData, users, visitsData] = await Promise.all([
        getAllOrders(),
        getProducts({ limit: 1000 }),
        getAllUsers(),
        getVisitsStats(),
      ]);

      const orders = ordersData.orders;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const revenue = orders.reduce((sum, order) => sum + order.finalTotal, 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalProducts: productsData.products.length,
        totalUsers: users.length,
        revenue,
        totalVisits: visitsData.total_visits,
        todayVisits: visitsData.today_visits,
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card className="hover:shadow-lg transition-all duration-200 border">
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const statCards = [
    {
      title: 'Commandes totales',
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      description: `${stats.pendingOrders} en attente`,
    },
    {
      title: 'Produits',
      value: stats.totalProducts.toLocaleString(),
      icon: Package,
      description: 'Articles disponibles',
    },
    {
      title: 'Utilisateurs',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: 'Comptes actifs',
    },
    /*{
      title: 'Revenus',
      value: `${(stats.revenue / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`,
      icon: DollarSignIcon,
      description: 'Chiffre d\'affaires',
    },*/
    {
      title: 'Visites totales',
      value: stats.totalVisits.toLocaleString(),
      icon: Calendar,
      description: 'Toutes les visites',
    },
    {
      title: 'Visites aujourd\'hui',
      value: stats.todayVisits.toLocaleString(),
      icon: Smartphone,
      description: 'Visiteurs du jour',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tableau de bord</h1>
          <p className="text-lg text-muted-foreground">Vue d'ensemble de votre activité</p>
        </div>
        <Button
          onClick={loadStats}
          variant="outline"
          size="lg"
        >
          🔄 Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {statCards.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Cartes d'activité et actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Activité récente */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <ShoppingBag className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="font-semibold">Nouvelle commande #1245</p>
                  <p className="text-sm text-muted-foreground">Il y a 12 minutes</p>
                </div>
              </div>
              <Badge>En attente</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Users className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="font-semibold">Nouvel utilisateur inscrit</p>
                  <p className="text-sm text-muted-foreground">Il y a 2 heures</p>
                </div>
              </div>
              <Badge>Succès</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <Calendar className="h-6 w-6 text-gray-500" />
                <div>
                  <p className="font-semibold">{stats.todayVisits} visites aujourd'hui</p>
                  <p className="text-sm text-muted-foreground">+{Math.floor(Math.random() * 20)}% vs hier</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/products')}
            >
              <Package className="mr-2 h-5 w-5" />
              Ajouter un produit
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/orders')}
            >
              <Zap className="mr-2 h-5 w-5" />
              Créer une vente flash
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="mr-2 h-5 w-5" />
              Gérer les utilisateurs
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/admin/visits')}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Voir les visites
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
