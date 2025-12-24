import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Scan,
  Activity,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  FileText,
  Loader2,
  Stethoscope,
  HeartPulse,
  Brain,
} from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  totalScans: number;
  highRiskCount: number;
  vitalsToday: number;
}

interface RecentPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  created_at: string;
}

export default function Dashboard() {
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalScans: 0,
    highRiskCount: 0,
    vitalsToday: 0,
  });
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch patients count
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });

        // Fetch scans count
        const { count: scansCount } = await supabase
          .from('medical_scans')
          .select('*', { count: 'exact', head: true });

        // Fetch high risk scans count
        const { count: highRiskCount } = await supabase
          .from('medical_scans')
          .select('*', { count: 'exact', head: true })
          .eq('risk_level', 'high');

        // Fetch today's vitals
        const today = new Date().toISOString().split('T')[0];
        const { count: vitalsCount } = await supabase
          .from('vitals')
          .select('*', { count: 'exact', head: true })
          .gte('recorded_at', today);

        setStats({
          totalPatients: patientsCount || 0,
          totalScans: scansCount || 0,
          highRiskCount: highRiskCount || 0,
          vitalsToday: vitalsCount || 0,
        });

        // Fetch recent patients
        const { data: patients } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentPatients(patients || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getRiskLevel = (patient: RecentPatient): 'low' | 'medium' | 'high' => {
    const riskFactors = patient.allergies.length + patient.chronic_conditions.length;
    if (riskFactors >= 3) return 'high';
    if (riskFactors >= 1) return 'medium';
    return 'low';
  };

  const statCards = [
    {
      label: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Medical Scans',
      value: stats.totalScans,
      icon: Scan,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'High Risk Cases',
      value: stats.highRiskCount,
      icon: AlertTriangle,
      color: 'text-risk-high',
      bgColor: 'bg-risk-high/10',
    },
    {
      label: 'Vitals Recorded Today',
      value: stats.vitalsToday,
      icon: Activity,
      color: 'text-risk-low',
      bgColor: 'bg-risk-low/10',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Welcome back, {role === 'doctor' ? 'Dr. ' : ''}{profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {role === 'doctor' 
                ? "Here's your clinical dashboard overview"
                : "Here's your patient care dashboard"}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/patients">
                <Users className="w-4 h-4 mr-2" />
                View All Patients
              </Link>
            </Button>
            <Button variant="medical" asChild>
              <Link to="/analysis">
                <Scan className="w-4 h-4 mr-2" />
                New Analysis
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <div
              key={stat.label}
              className="metric-card animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-risk-low" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent patients */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-soft">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Recent Patients</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patients">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {recentPatients.length > 0 ? (
                recentPatients.map((patient, i) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {patient.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.age} years • {patient.gender} • {patient.blood_group}
                      </p>
                    </div>
                    <RiskBadge level={getRiskLevel(patient)} size="sm" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No patients registered yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick analysis panel */}
          <div className="bg-card rounded-xl border border-border shadow-soft">
            <div className="p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                AI Analysis Types
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { name: 'Chest X-Ray', icon: Scan, desc: 'Pneumonia detection' },
                { name: 'CT Scan', icon: Brain, desc: 'Multi-organ analysis' },
                { name: 'ECG Analysis', icon: HeartPulse, desc: 'Cardiac rhythm' },
                { name: 'General Diagnosis', icon: Stethoscope, desc: 'Vitals-based risk' },
              ].map((analysis, i) => (
                <Link
                  key={analysis.name}
                  to="/analysis"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <analysis.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{analysis.name}</p>
                    <p className="text-xs text-muted-foreground">{analysis.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            to="/analysis"
            className="flex items-center gap-4 p-5 bg-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Scan className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                Upload Scan
              </p>
              <p className="text-sm text-muted-foreground">AI-powered analysis</p>
            </div>
          </Link>

          <Link
            to="/vitals"
            className="flex items-center gap-4 p-5 bg-secondary/5 rounded-xl border border-secondary/20 hover:border-secondary/40 hover:bg-secondary/10 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Activity className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground group-hover:text-secondary transition-colors">
                Record Vitals
              </p>
              <p className="text-sm text-muted-foreground">Monitor patient health</p>
            </div>
          </Link>

          <Link
            to="/records"
            className="flex items-center gap-4 p-5 bg-muted rounded-xl border border-border hover:border-primary/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-foreground/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Medical Records</p>
              <p className="text-sm text-muted-foreground">View patient history</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
