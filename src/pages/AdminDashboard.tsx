import { Navbar as TopNavbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  PackageSearch,
  ShoppingBag,
  Ticket,
  Users,
  UserCog,
  BarChart3,
  MonitorSmartphone,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-pulse shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-primary-foreground animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Chargement de l'interface admin...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
    { icon: Package, label: 'Gestion des Produits', path: '/admin/products' },
    { icon: FolderTree, label: 'Catégories', path: '/admin/categories' },
    { icon: ShoppingBag, label: 'Gestion des Commandes', path: '/admin/orders' },
    { icon: Zap, label: 'Ventes Flash', path: '/admin/flash-sales' },
    { icon: Image, label: 'Bannières', path: '/admin/banners' },
    { icon: Ticket, label: 'Bons d\'achat', path: '/admin/vouchers' },
    { icon: FileText, label: 'Factures', path: '/admin/invoices' },
    { icon: PackageSearch, label: 'Gestion Stock', path: '/admin/stock' },
    { icon: FolderTree, label: 'Rapports de ventes', path: '/admin/sales-reports' },
    { icon: Users, label: 'Gestion Utilisateurs', path: '/admin/users' },
    { icon: MessageSquare, label: 'Messages Contact', path: '/admin/contacts-messages' },
    { icon: MonitorSmartphone, label: 'POS — Caissiers', path: '/admin/pos-cashiers' },
    { icon: BarChart3, label: 'POS — Rapports', path: '/admin/pos-reports' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar fixe en haut */}
      <TopNavbar />

      {/* Container principal avec sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Desktop - Position fixe avec scroll indépendant */}
        <aside
          className={cn(
            'hidden lg:flex flex-col bg-card border-r transition-all duration-300 ease-in-out',
            'fixed top-16 left-0 bottom-0 z-40',
            isCollapsed ? 'w-16' : 'w-64'
          )}
        >
          {/* Header Sidebar */}
          <div className={cn(
            'relative border-b transition-all duration-300 flex-shrink-0',
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

            {/* Toggle Button */}
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

          {/* Navigation - Zone scrollable */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ animationDelay: `${index * 20}ms` }}
                  className="block animate-in fade-in slide-in-from-left duration-200"
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
                      <span className="text-sm font-medium truncate">
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

          {/* Footer - Déconnexion (fixe en bas) */}
          <div className="p-3 border-t flex-shrink-0 bg-card">
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
                <span className="text-sm font-medium">
                  Déconnexion
                </span>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Content - Décalé selon la largeur de la sidebar */}
        <main
          className={cn(
            'flex-1 overflow-y-auto transition-all duration-300',
            isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          )}
        >
          <div className="container mx-auto p-6 lg:p-8 animate-in fade-in slide-in-from-right duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;