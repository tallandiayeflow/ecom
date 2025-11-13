import { SearchBar } from '@/components/SearchBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FileText,
  FolderTree,
  Image,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Package,
  PackageSearch,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sun,
  Ticket,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setSidebarOpen(false);
  };

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
    { icon: Package, label: 'Produits', path: '/admin/products' },
    { icon: FolderTree, label: 'Catégories', path: '/admin/categories' },
    { icon: ShoppingBag, label: 'Commandes', path: '/admin/orders' },
    { icon: Zap, label: 'Ventes Flash', path: '/admin/flash-sales' },
    { icon: Image, label: 'Bannières', path: '/admin/banners' },
    { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    { icon: Ticket, label: 'Bons d\'achat', path: '/admin/vouchers' },
    { icon: FileText, label: 'Factures', path: '/admin/invoices' },
    { icon: PackageSearch, label: 'Stock', path: '/admin/stock' },
  ];

  const userMenuItems = [
    { icon: User, label: 'Mon Profil', path: '/profile' },
    { icon: ShoppingBag, label: 'Mes Commandes', path: '/orders' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="hidden sm:inline-block text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                PhoneShop
              </span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar />
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>

              {/* Cart (Visible on all screens now) */}
              {user?.role !== 'admin' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/cart')}
                  className="relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              )}

              {/* User Menu (Visible on all screens) */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.role === 'admin' ? (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        Tableau de bord
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          Mon Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/orders')}>
                          Mes Commandes
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('/auth')} size="sm">
                  Connexion
                </Button>
              )}

              {/* Mobile Menu Toggle (Hamburger) */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card shadow-xl z-50 flex flex-col p-6 space-y-4 md:hidden overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Menu</h2>
              <Button variant="ghost" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Menu Content */}
            {!isAuthenticated ? (
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => {
                  setSidebarOpen(false);
                  navigate('/auth');
                }}
              >
                <LogIn className="mr-2 h-4 w-4" /> Se connecter
              </Button>
            ) : (
              <>
                <div className="flex flex-col space-y-2">
                  {(user?.role === 'admin' ? adminMenuItems : userMenuItems).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start">
                          <Icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto pt-6 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:bg-destructive/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
};
