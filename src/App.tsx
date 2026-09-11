import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ARViewer from "./pages/ARViewer";
import ConfiguratorPage from "./pages/ConfiguratorPage";
import NotFound from "./pages/NotFound";
import CustomerEstimate from "./pages/CustomerEstimate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ConfiguratorPage />} />
          <Route path="/ar" element={<ARViewer />} />
          <Route path="/configurator" element={<ConfiguratorPage />} />
          <Route path="/estimate/:id" element={<CustomerEstimate />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
