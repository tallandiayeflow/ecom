import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Navbar } from "@/components/Navbar";

import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Overview from "./pages/admin/Overview";
import OrdersManagement from "./pages/admin/OrdersManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes with Navbar */}
                <Route
                  path="/*"
                  element={
                    <>
                      <Navbar />
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/profile" element={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Page profil - À développer</div>} />
                      </Routes>
                    </>
                  }
                />

                {/* Auth Route (no navbar) */}
                <Route path="/auth" element={<Auth />} />

                {/* Admin Routes (no navbar, has own layout) */}
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route index element={<Overview />} />
                  <Route path="products" element={<div className="text-center p-12 text-muted-foreground">Module de gestion des produits - À développer</div>} />
                  <Route path="categories" element={<div className="text-center p-12 text-muted-foreground">Module de gestion des catégories - À développer</div>} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="flash-sales" element={<div className="text-center p-12 text-muted-foreground">Module de gestion des ventes flash - À développer</div>} />
                  <Route path="banners" element={<div className="text-center p-12 text-muted-foreground">Module de gestion des bannières - À développer</div>} />
                  <Route path="users" element={<div className="text-center p-12 text-muted-foreground">Module de gestion des utilisateurs - À développer</div>} />
                  <Route path="vouchers" element={<div className="text-center p-12 text-muted-foreground">Module de génération des bons d'achat - À développer</div>} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
