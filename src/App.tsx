import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderNotificationWatcher } from "@/components/OrderNotificationWatcher";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import InvoicePDF from "@/pages/admin/InvoicePdf";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import BookAppointment from "./pages/BookAppointement";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import FlashSales from "./pages/FlashSales";
import FlashsDetails from "./pages/FlashsDetails";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import JobApplicationForm from "./pages/JobsApplicationForm";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import PaymentCancel from "./pages/Payment-cancel";
import PaymentSuccess from "./pages/Payment-succes";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import LoyaltyRewards from "./pages/Rewards";
import Search from "./pages/Search";
import AppointmentsManagement from "./pages/admin/AppointManagement";
import BannersManagement from "./pages/admin/BannersManagement";
import CategoriesManagement from "./pages/admin/CategoriesManagement";
import FlashSalesManagement from "./pages/admin/FlashSalesManagement";
import InvoicesManagement from "./pages/admin/InvoicesManagement";
import JobsManagement from "./pages/admin/JobsManagement";
import OrderDetailUpdate from "./pages/admin/OrderUpdate";
import OrdersManagement from "./pages/admin/OrdersManagement";
import Overview from "./pages/admin/Overview";
import ProductsManagement from "./pages/admin/ProductsManagement";
import SalesReports from "./pages/admin/SalesRapports";
import StockManagement from "./pages/admin/StockManagement";
import UsersManagement from "./pages/admin/UsersManagement";
import AdminVisits from "./pages/admin/VisitManagements";
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
              <OrderNotificationWatcher />
              <Routes>
                {/* Auth Route (no navbar) */}
                <Route path="/auth" element={<Auth />} />

                {/* Admin Routes (no navbar, has own layout) */}
                <Route path="/admin" element={<AdminDashboard />}>
                  <Route index element={<Overview />} />
                  <Route path="products" element={<ProductsManagement />} />
                  <Route path="categories" element={<CategoriesManagement />} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="orders/update/:id" element={<OrderDetailUpdate />} />
                  <Route path="flash-sales" element={<FlashSalesManagement />} />
                  <Route path="banners" element={<BannersManagement />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="vouchers" element={<VouchersManagement />} />
                  <Route path="invoices" element={<InvoicesManagement />} />
                  <Route path="invoices/:id" element={<InvoicePDF />} />
                  <Route path="stock" element={<StockManagement />} />
                  <Route path="visits" element={<AdminVisits />} />
                  <Route path="jobs" element={<JobsManagement />} />
                  <Route path="appointments" element={<AppointmentsManagement />} />
                  <Route path="sales-reports" element={<SalesReports />} />
                </Route>

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
                          <Route path="/flash" element={<FlashSales />} />
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
                          <Route path="/rewards" element={<LoyaltyRewards />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/payment-success" element={<PaymentSuccess />} />
                          <Route path="/payment-cancel" element={<PaymentCancel />} />
                          <Route path="/jobs-application" element={<JobApplicationForm />} />
                          <Route path="/book-appointment" element={<BookAppointment />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  }
                />

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
