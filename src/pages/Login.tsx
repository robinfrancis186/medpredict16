import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/medical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { 
  ShieldCheck, 
  Stethoscope, 
  UserCog, 
  User,
  Lock,
  Mail,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const roleOptions: { role: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  { role: 'doctor', label: 'Doctor', description: 'Full access to patient records and AI analysis', icon: Stethoscope },
  { role: 'nurse', label: 'Nurse / Staff', description: 'Access to vitals and patient care', icon: UserCog },
  { role: 'patient', label: 'Patient', description: 'View your own records (read-only)', icon: User },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showDisclaimer) {
      setShowDisclaimer(true);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, selectedRole);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-primary-foreground">MedPredict</h1>
              <p className="text-primary-foreground/70">AI-Powered Diagnostics</p>
            </div>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6 leading-tight">
            Clinical Decision
            <br />
            Support System
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
            Advanced AI-assisted disease prediction platform for healthcare professionals. 
            Analyze X-rays, monitor vitals, and get comprehensive risk assessments.
          </p>

          <div className="space-y-4">
            {[
              'CNN-based X-ray analysis with Grad-CAM visualization',
              'Real-time vitals monitoring and risk scoring',
              'HIPAA-compliant secure patient records',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-foreground/80">
                <div className="w-6 h-6 rounded-full bg-secondary/30 flex items-center justify-center">
                  <Activity className="w-3.5 h-3.5 text-secondary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">MedPredict</h1>
              <p className="text-sm text-muted-foreground">AI Diagnostics</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to access the clinical dashboard</p>
          </div>

          {showDisclaimer ? (
            <div className="animate-fade-in">
              <ClinicalDisclaimer variant="consent" className="mb-6" />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDisclaimer(false)}
                >
                  Go Back
                </Button>
                <Button
                  variant="medical"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'I Understand, Continue'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select your role</Label>
                <div className="grid gap-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setSelectedRole(option.role)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        selectedRole === option.role
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                          selectedRole === option.role
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <option.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          'font-medium',
                          selectedRole === option.role ? 'text-primary' : 'text-foreground'
                        )}>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      {selectedRole === option.role && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="medical" size="lg" className="w-full group">
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Demo mode: Use any email and password to sign in
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
