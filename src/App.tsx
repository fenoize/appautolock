import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ClientsList from "./pages/clients/ClientsList";
import NewClient from "./pages/clients/NewClient";
import ClientDetail from "./pages/clients/ClientDetail";
import VehiclesList from "./pages/vehicles/VehiclesList";
import NewVehicle from "./pages/vehicles/NewVehicle";
import VehicleDetail from "./pages/vehicles/VehicleDetail";
import WOList from "./pages/workOrders/WOList";
import NewWO from "./pages/workOrders/NewWO";
import WODetail from "./pages/workOrders/WODetail";

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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/new" element={<NewClient />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/vehicles" element={<VehiclesList />} />
          <Route path="/vehicles/new" element={<NewVehicle />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/work-orders" element={<WOList />} />
          <Route path="/work-orders/new" element={<NewWO />} />
          <Route path="/work-orders/:id" element={<WODetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
