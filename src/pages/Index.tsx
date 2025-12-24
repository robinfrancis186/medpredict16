import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, role } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect based on role
        if (role === 'patient') {
          navigate('/portal');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/auth');
      }
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-glow">
        <ShieldCheck className="w-8 h-8 text-primary-foreground" />
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading MedPredict...</p>
    </div>
  );
};

export default Index;
