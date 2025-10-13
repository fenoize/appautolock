import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ClientsList from "./pages/clients/ClientsList";
import NewClient from "./pages/clients/NewClient";
import ClientDetail from "./pages/clients/ClientDetail";
import VehiclesList from "./pages/vehicles/VehiclesList";
import NewVehicle from "./pages/vehicles/NewVehicle";
import VehicleDetail from "./pages/vehicles/VehicleDetail";
import WOList from "./pages/workOrders/WOList";
import NewWO from "./pages/workOrders/NewWO";
import WODetail from "./pages/workOrders/WODetail";
import SubscriptionList from "./pages/subscriptions/SubscriptionList";
import SubscriptionDetail from "./pages/subscriptions/SubscriptionDetail";
import NewSubscription from "./pages/subscriptions/NewSubscription";
import SubscriptionPlans from "./pages/subscriptions/SubscriptionPlans";
import SubscriptionReports from "./pages/subscriptions/SubscriptionReports";
import ProductsList from "./pages/inventory/ProductsList";
import ProductDetail from "./pages/inventory/ProductDetail";
import NewProduct from "./pages/inventory/NewProduct";
import InventoryReports from "./pages/inventory/InventoryReports";
import StockAlerts from "./pages/inventory/StockAlerts";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import SettingsLayout from "./pages/settings/SettingsLayout";
import GeneralSettings from "./pages/settings/GeneralSettings";
import CompanySettings from "./pages/settings/CompanySettings";
import NumeradoresSettings from "./pages/settings/NumeradoresSettings";
import NotificationsSettings from "./pages/settings/NotificationsSettings";
import PDFSettings from "./pages/settings/PDFSettings";
import IntegrationsSettings from "./pages/settings/IntegrationsSettings";
import BackupsSettings from "./pages/settings/BackupsSettings";
import AuditSettings from "./pages/settings/AuditSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientsList /></ProtectedRoute>} />
          <Route path="/clients/new" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><VehiclesList /></ProtectedRoute>} />
          <Route path="/vehicles/new" element={<ProtectedRoute><NewVehicle /></ProtectedRoute>} />
          <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetail /></ProtectedRoute>} />
          <Route path="/work-orders" element={<ProtectedRoute><WOList /></ProtectedRoute>} />
          <Route path="/work-orders/new" element={<ProtectedRoute><NewWO /></ProtectedRoute>} />
          <Route path="/work-orders/:id" element={<ProtectedRoute><WODetail /></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionList /></ProtectedRoute>} />
          <Route path="/subscriptions/new" element={<ProtectedRoute><NewSubscription /></ProtectedRoute>} />
          <Route path="/subscriptions/:id" element={<ProtectedRoute><SubscriptionDetail /></ProtectedRoute>} />
          <Route path="/subscriptions/plans" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
          <Route path="/subscriptions/reports" element={<ProtectedRoute><SubscriptionReports /></ProtectedRoute>} />
          
          {/* Inventario */}
          <Route path="/inventory" element={<ProtectedRoute><ProductsList /></ProtectedRoute>} />
          <Route path="/inventory/products/new" element={<ProtectedRoute><NewProduct /></ProtectedRoute>} />
          <Route path="/inventory/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/inventory/reports" element={<ProtectedRoute><InventoryReports /></ProtectedRoute>} />
          <Route path="/inventory/alerts" element={<ProtectedRoute><StockAlerts /></ProtectedRoute>} />
          
          {/* Analytics */}
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
          
          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}>
            <Route index element={<GeneralSettings />} />
            <Route path="company" element={<CompanySettings />} />
            <Route path="numeradores" element={<NumeradoresSettings />} />
            <Route path="notifications" element={<NotificationsSettings />} />
            <Route path="pdfs" element={<PDFSettings />} />
            <Route path="integrations" element={<IntegrationsSettings />} />
            <Route path="backups" element={<BackupsSettings />} />
            <Route path="audit" element={<AuditSettings />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
