import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ShieldCheck,
  Stethoscope,
  UserCog,
  User,
  Lock,
  Mail,
  ArrowRight,
  Activity,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'doctor' | 'nurse' | 'patient';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const roleOptions: { role: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  { role: 'doctor', label: 'Doctor', description: 'Full access to patient records and AI analysis', icon: Stethoscope },
  { role: 'nurse', label: 'Nurse / Staff', description: 'Access to vitals and patient care', icon: UserCog },
  { role: 'patient', label: 'Patient', description: 'View your own records (read-only)', icon: User },
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const { signIn, signUp, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateForm = () => {
    try {
      authSchema.parse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: typeof errors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isLogin && !showDisclaimer) {
      setShowDisclaimer(true);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Invalid credentials', {
              description: 'Please check your email and password.',
            });
          } else {
            toast.error('Login failed', { description: error.message });
          }
          return;
        }
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        const { error } = await signUp(email, password, fullName, selectedRole);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Account exists', {
              description: 'This email is already registered. Please sign in instead.',
            });
          } else {
            toast.error('Registration failed', { description: error.message });
          }
          return;
        }
        toast.success('Account created!', {
          description: 'You can now access the system.',
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error('An error occurred', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            Comprehensive
            <br />
            Medical Platform
          </h2>

          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
            Complete healthcare management with AI-assisted diagnostics, patient records,
            vitals monitoring, and secure data storage.
          </p>

          <div className="space-y-4">
            {[
              'Multi-modal AI analysis (X-Ray, CT, MRI, ECG)',
              'Real-time vitals monitoring and risk scoring',
              'Secure role-based access control',
              'HIPAA-compliant patient records',
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

      {/* Right panel - Auth form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">MedPredict</h1>
              <p className="text-sm text-muted-foreground">Medical Platform</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isLogin ? 'Sign in to access the clinical dashboard' : 'Register to get started with MedPredict'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setShowDisclaimer(false); }}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setShowDisclaimer(false); }}
              className={cn(
                'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                !isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign Up
            </button>
          </div>

          {showDisclaimer && !isLogin ? (
            <div className="animate-fade-in">
              <ClinicalDisclaimer variant="consent" className="mb-6" />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowDisclaimer(false)}>
                  Go Back
                </Button>
                <Button variant="medical" className="flex-1" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'I Understand, Continue'}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role selection (signup only) */}
              {!isLogin && (
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
                          <p className={cn('font-medium', selectedRole === option.role ? 'text-primary' : 'text-foreground')}>
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
              )}

              {/* Full name (signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder="Dr. John Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={cn('pl-10 h-11', errors.fullName && 'border-destructive')}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>
              )}

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
                    className={cn('pl-10 h-11', errors.email && 'border-destructive')}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
                    className={cn('pl-10 h-11', errors.password && 'border-destructive')}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" variant="medical" size="lg" className="w-full group" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setShowDisclaimer(false); }}
                  className="ml-1 text-primary hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
