import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Destinos from "./pages/Destinos";
import Reserva from "./pages/Reserva";
import Checkout from "./pages/Checkout";
import MinhasReservas from "./pages/MinhasReservas";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Auth page without layout */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Pages with layout */}
          <Route path="/home" element={<Layout><Home /></Layout>} />
          <Route path="/destinos" element={<Layout><Destinos /></Layout>} />
          <Route path="/reserva" element={<Layout><Reserva /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/minhas-reservas" element={<Layout><MinhasReservas /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
