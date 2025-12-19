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
  LogIn,
  LogOut,
  Moon,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sun,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="w-full px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo - Aligné avec le sidebar */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/25">
                <Smartphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                PhoneShop
              </span>
            </div>
          </div>

          {/* Search Bar - Centré */}
          <div className="hidden md:block flex-1 max-w-2xl">
            <SearchBar />
          </div>

          {/* Right Section - Actions groupées */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-110 hover:bg-accent"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Cart - Uniquement pour non-admin */}
            {user?.role !== 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/cart')}
                className="relative rounded-xl transition-all duration-300 hover:scale-110 hover:bg-accent"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs animate-in zoom-in-50 duration-300">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 rounded-xl px-3 transition-all duration-300 hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="hidden sm:inline-block text-sm font-medium">
                        {user?.name}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 animate-in slide-in-from-top-2 duration-200"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {user?.role === 'admin' && (
                        <>
                        
                        <Badge className="w-fit text-xs mt-1" variant="secondary">
                          Administrateur
                        </Badge>
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                        </>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role !== 'admin' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate('/profile')}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Mon Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate('/orders')}
                        className="cursor-pointer"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Mes Commandes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                size="sm"
                className="rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-6 pb-3">
        <SearchBar />
      </div>
    </nav>
  );
};
