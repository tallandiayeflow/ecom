import { Navbar as TopNavbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LogOut,
  Package,
  PackageSearch,
  ShoppingBag,
  Smartphone,
  Ticket,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
    { icon: Package, label: 'Produits', path: '/admin/products' },
    { icon: FolderTree, label: 'Catégories', path: '/admin/categories' },
    { icon: ShoppingBag, label: 'Commandes', path: '/admin/orders' },
    { icon: Zap, label: 'Ventes Flash', path: '/admin/flash-sales' },
    { icon: Image, label: 'Bannières', path: '/admin/banners' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    { icon: Ticket, label: 'Bons d\'achat', path: '/admin/vouchers' },
    { icon: FileText, label: 'Factures', path: '/admin/invoices' },
    { icon: PackageSearch, label: 'Gestion Stock', path: '/admin/stock' },
    { icon: Smartphone, label: 'Visites', path: '/admin/visits' },
    { icon: Zap, label: 'Jobs', path: '/admin/jobs' },
    { icon: Calendar, label: 'Rendez-vous', path: '/admin/appointments' },
    { icon: FolderTree, label: 'Rapports de ventes', path: '/admin/sales-reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar - Toujours visible */}
      <TopNavbar />

      <div className="flex flex-1 relative">
        {/* Sidebar Desktop - Synchronisé avec le navbar */}
        <aside
          className={cn(
            'hidden lg:flex flex-col bg-card border-r transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Header - Même hauteur que les éléments du navbar */}
          <div className={cn(
            'relative border-b transition-all duration-300',
            isCollapsed ? 'p-3' : 'p-6'
          )}>
            {!isCollapsed ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left duration-200">
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Admin Dashboard
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Bienvenue, {user.name}
                </p>
              </div>
            ) : (
              <div className="flex justify-center animate-in fade-in zoom-in duration-200">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            )}

            {/* Toggle Button - Style amélioré */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg border bg-background shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg',
                isCollapsed ? '-right-3.5' : '-right-3.5'
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation - Scrollable avec style uniforme */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ animationDelay: `${index * 20}ms` }}
                  className="block"
                >
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full transition-all duration-200 group relative',
                      isCollapsed ? 'justify-center px-0 h-11' : 'justify-start h-11',
                      !isActive && 'hover:bg-accent hover:translate-x-0.5',
                      isActive && 'shadow-md shadow-primary/20'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-all duration-200 group-hover:scale-110',
                        !isCollapsed && 'mr-3',
                        isActive && 'drop-shadow-lg'
                      )}
                    />
                    {!isCollapsed && (
                      <span className="text-sm font-medium animate-in fade-in slide-in-from-left duration-200">
                        {item.label}
                      </span>
                    )}

                    {/* Active Indicator */}
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                    )}
                    {isActive && isCollapsed && (
                      <div className="absolute inset-0 border-2 border-primary-foreground rounded-lg" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Footer - Déconnexion alignée */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className={cn(
                'w-full text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group h-11',
                isCollapsed ? 'justify-center px-0' : 'justify-start'
              )}
              onClick={handleLogout}
              title={isCollapsed ? 'Déconnexion' : undefined}
            >
              <LogOut
                className={cn(
                  'h-5 w-5 transition-all duration-200 group-hover:scale-110',
                  !isCollapsed && 'mr-3'
                )}
              />
              {!isCollapsed && (
                <span className="text-sm font-medium animate-in fade-in slide-in-from-left duration-200">
                  Déconnexion
                </span>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content - Padding et design harmonisé */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 lg:p-8 animate-in fade-in slide-in-from-right duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
