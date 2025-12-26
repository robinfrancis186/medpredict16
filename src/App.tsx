import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import XRayAnalysis from "./pages/XRayAnalysis";
import VitalsMonitor from "./pages/VitalsMonitor";
import MedicalRecords from "./pages/MedicalRecords";
import Appointments from "./pages/Appointments";
import LabResults from "./pages/LabResults";
import PatientPortal from "./pages/PatientPortal";
import Prescriptions from "./pages/Prescriptions";
import Insurance from "./pages/Insurance";
import NotFound from "./pages/NotFound";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Protected route for authenticated users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

// Staff-only route (doctors and nurses)
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Patients should be redirected to their portal
  if (role === 'patient') {
    return <Navigate to="/portal" replace />;
  }
  
  return <>{children}</>;
}

// Doctor-only route
function DoctorRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (role === 'patient') {
    return <Navigate to="/portal" replace />;
  }
  
  // Only doctors can access certain features
  if (role !== 'doctor') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Patient-only route
function PatientRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Staff should be redirected to dashboard
  if (role !== 'patient') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Staff Routes (Doctors & Nurses) */}
      <Route
        path="/dashboard"
        element={
          <StaffRoute>
            <Dashboard />
          </StaffRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <StaffRoute>
            <Patients />
          </StaffRoute>
        }
      />
      <Route
        path="/patients/:id"
        element={
          <StaffRoute>
            <PatientDetail />
          </StaffRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <StaffRoute>
            <XRayAnalysis />
          </StaffRoute>
        }
      />
      <Route
        path="/vitals"
        element={
          <StaffRoute>
            <VitalsMonitor />
          </StaffRoute>
        }
      />
      <Route
        path="/records"
        element={
          <StaffRoute>
            <MedicalRecords />
          </StaffRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <StaffRoute>
            <Appointments />
          </StaffRoute>
        }
      />
      <Route
        path="/lab-results"
        element={
          <StaffRoute>
            <LabResults />
          </StaffRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <StaffRoute>
            <Prescriptions />
          </StaffRoute>
        }
      />
      <Route
        path="/insurance"
        element={
          <StaffRoute>
            <Insurance />
          </StaffRoute>
        }
      />
      
      {/* Patient Portal */}
      <Route
        path="/portal"
        element={
          <PatientRoute>
            <PatientPortal />
          </PatientRoute>
        }
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
          <OfflineIndicator />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
