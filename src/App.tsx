import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
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
import NewPlan from "./pages/subscriptions/NewPlan";
import PlanDetail from "./pages/subscriptions/PlanDetail";
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
import UsersList from "./pages/admin/UsersList";
import UserDetail from "./pages/admin/UserDetail";
import InviteUser from "./pages/admin/InviteUser";
import QuotesList from "./pages/quotes/QuotesList";
import NewQuote from "./pages/quotes/NewQuote";
import QuoteDetail from "./pages/quotes/QuoteDetail";
import ServicesList from "./pages/services/ServicesList";
import NewService from "./pages/services/NewService";
import ServiceDetail from "./pages/services/ServiceDetail";

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
          
          {/* Rutas protegidas con Layout */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><AppLayout><ClientsList /></AppLayout></ProtectedRoute>} />
          <Route path="/clients/new" element={<ProtectedRoute><AppLayout><NewClient /></AppLayout></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><AppLayout><ClientDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><AppLayout><VehiclesList /></AppLayout></ProtectedRoute>} />
          <Route path="/vehicles/new" element={<ProtectedRoute><AppLayout><NewVehicle /></AppLayout></ProtectedRoute>} />
          <Route path="/vehicles/:id" element={<ProtectedRoute><AppLayout><VehicleDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders" element={<ProtectedRoute><AppLayout><WOList /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/new" element={<ProtectedRoute><AppLayout><NewWO /></AppLayout></ProtectedRoute>} />
          <Route path="/work-orders/:id" element={<ProtectedRoute><AppLayout><WODetail /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><AppLayout><SubscriptionList /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions/new" element={<ProtectedRoute><AppLayout><NewSubscription /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions/:id" element={<ProtectedRoute><AppLayout><SubscriptionDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions/plans" element={<ProtectedRoute><AppLayout><SubscriptionPlans /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions/plans/new" element={<ProtectedRoute><AppLayout><NewPlan /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions/plans/:id" element={<ProtectedRoute><AppLayout><PlanDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/subscriptions/reports" element={<ProtectedRoute><AppLayout><SubscriptionReports /></AppLayout></ProtectedRoute>} />
          
          {/* Cotizaciones */}
          <Route path="/quotes" element={<ProtectedRoute><AppLayout><QuotesList /></AppLayout></ProtectedRoute>} />
          <Route path="/quotes/new" element={<ProtectedRoute><AppLayout><NewQuote /></AppLayout></ProtectedRoute>} />
          <Route path="/quotes/:id" element={<ProtectedRoute><AppLayout><QuoteDetail /></AppLayout></ProtectedRoute>} />
          
          {/* Inventario */}
          <Route path="/inventory" element={<ProtectedRoute><AppLayout><ProductsList /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory/products/new" element={<ProtectedRoute><AppLayout><NewProduct /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory/products/:id" element={<ProtectedRoute><AppLayout><ProductDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory/reports" element={<ProtectedRoute><AppLayout><InventoryReports /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory/alerts" element={<ProtectedRoute><AppLayout><StockAlerts /></AppLayout></ProtectedRoute>} />
          
          {/* Analytics */}
          <Route path="/analytics" element={<ProtectedRoute><AppLayout><AnalyticsDashboard /></AppLayout></ProtectedRoute>} />
          
          {/* Servicios */}
          <Route path="/services" element={<ProtectedRoute><AppLayout><ServicesList /></AppLayout></ProtectedRoute>} />
          <Route path="/services/new" element={<ProtectedRoute><AppLayout><NewService /></AppLayout></ProtectedRoute>} />
          <Route path="/services/:id" element={<ProtectedRoute><AppLayout><ServiceDetail /></AppLayout></ProtectedRoute>} />
          
          {/* Admin - Usuarios */}
          <Route path="/admin/users" element={<ProtectedRoute><AppLayout><UsersList /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/users/new" element={<ProtectedRoute><AppLayout><InviteUser /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute><AppLayout><UserDetail /></AppLayout></ProtectedRoute>} />
          
          {/* Settings */}
          <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsLayout /></AppLayout></ProtectedRoute>}>
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
