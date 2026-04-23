import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { OrderProvider } from "./hooks/useOrder";
import { lazy, Suspense } from "react";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Pages - Eagerly loaded
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Pages - Lazy loaded
const Projects = lazy(() => import("./pages/Projects"));
const Records = lazy(() => import("./pages/Records"));
const TemplateLibraryPage = lazy(() => import("./pages/TemplateLibrary"));
const FontLibrary = lazy(() => import("./pages/FontLibrary"));
const Validation = lazy(() => import("./pages/Validation"));
const GenerateCards = lazy(() => import("./pages/GenerateCards"));
const PrintLayout = lazy(() => import("./pages/PrintLayout"));
const RequestTracking = lazy(() => import("./pages/RequestTracking"));
const Settings = lazy(() => import("./pages/Settings"));
const Customizer = lazy(() => import("./pages/Customizer"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const SchoolManagement = lazy(() => import("./pages/admin/SchoolManagement"));
const OrderManagement = lazy(() => import("./pages/admin/OrderManagement"));
const AdvertisementManagement = lazy(() => import("./pages/admin/AdvertisementManagement"));
const AdminTemplateLibrary = lazy(() => import("./pages/admin/TemplateLibrary"));



// Legacy pages (merged into Validation Hub)

const Verify = lazy(() => import("./pages/public/Verify"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrderProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/school/login" element={<Navigate to="/" replace />} />
                  <Route path="/admin/login" element={<Navigate to="/" replace />} />
                  <Route path="/verify" element={<Verify />} />
                  
                  {/* Dashboard routes */}
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/records" element={<Records />} />
                    <Route path="/templates" element={<TemplateLibraryPage />} />
                    <Route path="/fonts" element={<FontLibrary />} />
                    <Route path="/validation" element={<Validation />} />
                    <Route path="/import" element={<Navigate to="/validation" replace />} />
                    <Route path="/import/photos" element={<Navigate to="/validation" replace />} />
                    <Route path="/generate" element={<GenerateCards />} />
                    <Route path="/print-layout" element={<PrintLayout />} />
                    <Route path="/tracking" element={<RequestTracking />} />
                    <Route path="/customizer" element={<Customizer />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>

                  {/* Admin routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/schools" element={<SchoolManagement />} />
                  <Route path="/admin/orders" element={<OrderManagement />} />
                  <Route path="/admin/advertisements" element={<AdvertisementManagement />} />
                  <Route path="/admin/templates" element={<AdminTemplateLibrary />} />
                  
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </OrderProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
