import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllOrders, getAllUsers, getProducts, getVisitsStats } from '@/lib/api';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  Package,
  RefreshCw,
  ShoppingBag,
  Smartphone,
  Ticket,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  // Component Skeleton Amélioré
  const StatSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );

  // Stat Card Amélioré avec animations
  const StatCard = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    color,
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    trend?: { value: number; isPositive: boolean };
    color?: string;
  }) => (
    <Card className="group relative overflow-hidden border-primary/10 bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:scale-[1.02]">
      {/* Gradient Background */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-all duration-300 ${color || 'bg-primary'}`} />

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
        <div className={`p-2 rounded-lg ${color ? `${color}/10` : 'bg-primary/10'} transition-all duration-300 group-hover:scale-110`}>
          {Icon}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {value}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
              trend.isPositive
                ? 'bg-green-500/10 text-green-600'
                : 'bg-red-500/10 text-red-600'
            }`}>
              {trend.isPositive ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              {trend.value}%
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </Card>
  );

  // Activity Item Component
  const ActivityItem = ({
    icon: Icon,
    title,
    description,
    time,
    badge,
    badgeVariant,
  }: any) => (
    <div className="group relative p-4 rounded-lg border border-transparent hover:border-primary/20 bg-card/50 hover:bg-card transition-all duration-300 hover:translate-x-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 p-2 rounded-lg bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {time}
            </p>
          </div>
        </div>
        {badge && (
          <Badge
            variant={
              badgeVariant === 'pending'
                ? 'secondary'
                : badgeVariant === 'success'
                  ? 'default'
                  : 'outline'
            }
            className="mt-1 transition-all duration-300 group-hover:shadow-lg"
          >
            {badge}
          </Badge>
        )}
      </div>
    </div>
  );

  // Quick Action Button Amélioré
  const QuickActionButton = ({
    icon: Icon,
    label,
    path,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    path: string;
    color: string;
  }) => (
    <Button
      onClick={() => navigate(path)}
      variant="outline"
      className={`w-full justify-start h-12 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group ${color}`}
    >
      <div className={`p-2 rounded-lg ${color}/10 mr-3 transition-all duration-300 group-hover:scale-110 group-hover:${color}/20`}>
        {Icon}
      </div>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1" />
    </Button>
  );

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Header Section avec actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-primary/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">Tableau de bord</h1>
              <p className="text-sm text-muted-foreground">
                Vue d'ensemble de votre activité en temps réel
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="transition-all duration-300 hover:scale-105 hover:shadow-lg border-primary/20 hover:border-primary/50"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards - 5 colonnes responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/*<StatCard
          title="Chiffre d'affaires"
          value={`${(stats.revenue / 1000).toFixed(1)}k Fcfa`}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          description="Total généré"
          trend={{ value: 12, isPositive: true }}
          color="bg-green-500"
        />*/}
        <StatCard
          title="Commandes totales"
          value={stats.totalOrders}
          icon={<ShoppingBag className="h-5 w-5 text-blue-500" />}
          description={`${stats.pendingOrders} en attente`}
          trend={{ value: 8, isPositive: true }}
          color="bg-blue-500"
        />
        <StatCard
          title="Produits"
          value={stats.totalProducts}
          icon={<Package className="h-5 w-5 text-orange-500" />}
          description="Articles actifs"
          color="bg-orange-500"
        />
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5 text-purple-500" />}
          description="Comptes créés"
          trend={{ value: 5, isPositive: true }}
          color="bg-purple-500"
        />
        <StatCard
          title="Visites aujourd'hui"
          value={stats.todayVisits}
          icon={<Eye className="h-5 w-5 text-pink-500" />}
          description={`+${Math.floor(Math.random() * 30)}% vs hier`}
          trend={{ value: Math.floor(Math.random() * 20), isPositive: true }}
          color="bg-pink-500"
        />
      </div>

      {/* Content Grid - Activité & Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Activité Récente - 2 colonnes */}
        <Card className="xl:col-span-2 border-primary/10 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                Activité récente
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="transition-all duration-300 hover:scale-105"
              >
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActivityItem
              icon={ShoppingBag}
              title="Nouvelle commande #1245"
              description="iPhone 16 Pro Max x1"
              time="Il y a 12 minutes"
              badge="En attente"
              badgeVariant="pending"
            />
            <ActivityItem
              icon={Users}
              title="Nouvel utilisateur inscrit"
              description="Ahmed M. - ahmed@example.com"
              time="Il y a 2 heures"
              badge="Succès"
              badgeVariant="success"
            />
            <ActivityItem
              icon={Smartphone}
              title={`${stats.todayVisits} visites aujourd'hui`}
              description="Trafic en hausse"
              time="Mise à jour en temps réel"
              badge="+18%"
              badgeVariant="info"
            />
            <ActivityItem
              icon={AlertCircle}
              title="Stock faible détecté"
              description="iPhone 15 - 2 articles restants"
              time="Il y a 1 heure"
              badge="Alerte"
              badgeVariant="secondary"
            />
          </CardContent>
        </Card>

        {/* Actions Rapides - 1 colonne */}
        <Card className="border-primary/10 bg-gradient-to-br from-card to-card/50 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickActionButton
              icon={<Package className="h-5 w-5" />}
              label="Ajouter un produit"
              path="/admin/products"
              color="text-blue-500"
            />
            <QuickActionButton
              icon={<Zap className="h-5 w-5" />}
              label="Créer une vente flash"
              path="/admin/flash-sales"
              color="text-orange-500"
            />
            <QuickActionButton
              icon={<Users className="h-5 w-5" />}
              label="Gérer les utilisateurs"
              path="/admin/users"
              color="text-purple-500"
            />
            <QuickActionButton
              icon={<Eye className="h-5 w-5" />}
              label="Voir les visites"
              path="/admin/visits"
              color="text-pink-500"
            />
            <QuickActionButton
              icon={<ShoppingBag className="h-5 w-5" />}
              label="Voir les commandes"
              path="/admin/orders"
              color="text-green-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Stats de visites totales */}
      <Card className="border-primary/10 bg-gradient-to-r from-card via-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            Statistiques de visites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <p className="text-sm text-muted-foreground">Visites totales</p>
              <p className="text-3xl font-bold">
                {stats.totalVisits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Depuis le début</p>
            </div>
            <div className="space-y-2 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.todayVisits.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                +{Math.floor(Math.random() * 40)}% vs hier
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;