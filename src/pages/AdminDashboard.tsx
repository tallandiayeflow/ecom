import { Navbar as TopNavbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
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
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <TopNavbar />

      <div className="flex flex-1 relative">
        {/* Sidebar Desktop */}
        <aside className="hidden sm:flex w-64 bg-card border-r flex-col">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Admin Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn('w-full justify-start', !isActive && 'hover:bg-accent')}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </aside>

        {/* Sidebar Mobile */}
        {isSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40 sm:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-card border-r z-50 flex flex-col sm:hidden transition-transform transform">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    Admin Dashboard
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{user.name}</p>
                </div>
                <Button variant="ghost" onClick={() => setIsSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={cn('w-full justify-start', !isActive && 'hover:bg-accent')}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleLogout();
                    setIsSidebarOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </Button>
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default AdminDashboard;
