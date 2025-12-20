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
    { icon: Ticket, label: "Bons d'achat", path: '/admin/vouchers' },
    { icon: FileText, label: 'Factures', path: '/admin/invoices' },
    { icon: PackageSearch, label: 'Stock', path: '/admin/stock' },
    { icon: Smartphone, label: 'Visites', path: '/admin/visits' },
  ];

  const userMenuItems = [
    { icon: User, label: 'Mon Profil', path: '/profile' },
    { icon: ShoppingCart, label: 'Panier', path: '/cart' },
    { icon: ShoppingBag, label: 'Mes Commandes', path: '/orders' },
  ];

  return (
    <>
      {/* Desktop Navbar - Navigation Fixe */}
      <nav className="hidden lg:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                PhoneShop
              </span>
            </Link>

            {/* Navigation Links - Fixe sur grands écrans */}
            <div className="flex items-center space-x-1 flex-1 max-w-2xl mx-8">
              <div className="flex-1" />
      
              {/* Search Desktop */}
              <div className="w-96">
                <SearchBar />
              </div>
            </div>

            {/* Actions Droite */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:scale-105"
                onClick={toggleTheme}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
              </Button>

              {user?.role !== 'admin' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl relative hover:scale-105"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              )}

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 rounded-xl px-3 hover:bg-accent">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="hidden 2xl:inline text-sm font-medium max-w-24 truncate">
                          {user?.name}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.role === 'admin' &&(
                      <>
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Tableau de bord
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      Mon Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      Mes Commandes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" className="rounded-xl h-10" onClick={() => navigate('/auth')}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Connexion
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Tablet + Mobile Navbar */}
      <nav className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="md:hidden px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo Mobile */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <Smartphone className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                PhoneShop
              </span>
            </Link>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:scale-105"
                onClick={toggleTheme}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
              </Button>

              {user?.role !== 'admin' && totalItems > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl relative hover:scale-105"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                    {totalItems}
                  </Badge>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl hover:scale-105"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="pt-3 pb-2 px-4">
            <SearchBar />
          </div>
        </div>

        {/* Tablet Layout */}
        <div className="hidden md:lg:hidden px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                PhoneShop
              </span>
            </Link>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 rounded-xl"
                  onClick={() => navigate('/admin')}
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              )}
              <div className="w-72">
                <SearchBar />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={toggleTheme}
                >
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-72 bg-background border-r shadow-2xl md:hidden flex flex-col">
            <div className="p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <Link 
                  to="/" 
                  className="flex items-center gap-3" 
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Smartphone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    PhoneShop
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-xl hover:bg-accent"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Menu */}
              <nav className="flex-1 space-y-1 mb-8">
                {isAuthenticated ? (
                  <>
                    {(user?.role === 'admin' ? adminMenuItems.slice(0, 8) : userMenuItems).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Button
                            variant="ghost"
                            className="w-full h-14 justify-start gap-3 hover:bg-accent/80 text-left"
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-14 justify-start"
                    onClick={() => {
                      setSidebarOpen(false);
                      navigate('/auth');
                    }}
                  >
                    <LogIn className="mr-3 h-5 w-5" />
                    Se connecter
                  </Button>
                )}
              </nav>

              {/* Logout */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  className="w-full h-14 justify-start gap-3 text-destructive hover:bg-destructive/10 mt-auto"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  Déconnexion
                </Button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};
