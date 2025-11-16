import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import InvoicePDF from "@/pages/admin/InvoicePdf";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import FlashsDetails from "./pages/FlashsDetails";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import BannersManagement from "./pages/admin/BannersManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import FlashSalesManagement from "./pages/admin/FlashSalesManagement";
import InvoicesManagement from "./pages/admin/InvoicesManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import Overview from "./pages/admin/Overview";
import ProductsManagement from "./pages/admin/ProductsManagement";
import StockManagement from "./pages/admin/StockManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import VouchersManagement from "./pages/admin/VouchersManagement";
import OrderDetails from "./pages/orderDetails";

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
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/product/:id" element={<ProductDetail />} />
                          <Route path="/flash/:id" element={<FlashsDetails />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/order-success" element={<OrderSuccess />} />
                          <Route path="/orders" element={<Orders />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/invoices/:id" element={<InvoicePDF />} />
                          <Route path="/orders/:id" element={<OrderDetails />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  }
                />

                {/* Auth Route (no navbar) */}
                <Route path="/auth" element={<Auth />} />

                {/* Admin Routes (no navbar, has own layout) */}
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route index element={<Overview />} />
                  <Route path="products" element={<ProductsManagement />} />
                  <Route path="categories" element={<CategoriesManagement />} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="flash-sales" element={<FlashSalesManagement />} />
                  <Route path="banners" element={<BannersManagement />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="vouchers" element={<VouchersManagement />} />
                  <Route path="invoices" element={<InvoicesManagement />} />
                  <Route path="stock" element={<StockManagement />} />
                 

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
