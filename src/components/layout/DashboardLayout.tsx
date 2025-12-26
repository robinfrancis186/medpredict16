import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { NotificationBell } from '@/components/NotificationBell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Activity,
  Scan,
  ShieldCheck,
  ChevronRight,
  Calendar,
  TestTube,
  Stethoscope,
  UserCog,
  Pill,
  Shield,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: ('doctor' | 'nurse')[];
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  // Define navigation with role-based access
  const allNavigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['doctor', 'nurse'] },
    { name: 'Patients', href: '/patients', icon: Users, roles: ['doctor', 'nurse'] },
    { name: 'Scan Analysis', href: '/analysis', icon: Scan, roles: ['doctor', 'nurse'] },
    { name: 'Vitals Monitor', href: '/vitals', icon: Activity, roles: ['doctor', 'nurse'] },
    { name: 'Lab Results', href: '/lab-results', icon: TestTube, roles: ['doctor', 'nurse'] },
    { name: 'Prescriptions', href: '/prescriptions', icon: Pill, roles: ['doctor'] },
    { name: 'Insurance', href: '/insurance', icon: Shield, roles: ['doctor', 'nurse'] },
    { name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['doctor', 'nurse'] },
    { name: 'Records', href: '/records', icon: FileText, roles: ['doctor', 'nurse'] },
  ];

  // Filter navigation based on user role
  const navigation = allNavigation.filter(item => 
    role && item.roles.includes(role as 'doctor' | 'nurse')
  );

  const isActive = (path: string) => location.pathname.startsWith(path);

  const getRoleBadge = () => {
    switch (role) {
      case 'doctor':
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30 gap-1">
            <Stethoscope className="w-3 h-3" />
            Doctor
          </Badge>
        );
      case 'nurse':
        return (
          <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30 gap-1">
            <UserCog className="w-3 h-3" />
            Nurse
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <ShieldCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-foreground">MedPredict</h1>
              <p className="text-xs text-muted-foreground">Staff Portal</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role indicator */}
          <div className="px-4 py-3 border-b border-border">
            {getRoleBadge()}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'sidebar-item',
                  isActive(item.href) && 'sidebar-item-active'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {isActive(item.href) && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {role === 'doctor' ? 'Dr. ' : ''}{profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="w-4 h-4 text-chart-2" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>

        {/* Footer disclaimer */}
        <ClinicalDisclaimer variant="footer" />
      </div>
    </div>
  );
}
