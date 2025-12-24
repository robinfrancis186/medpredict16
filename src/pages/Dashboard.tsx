import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mockPatients, mockVitals, mockXRayAnalyses, calculateRiskAssessment } from '@/data/mockData';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Scan,
  Activity,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
  FileText,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Total Patients',
      value: mockPatients.length,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Analysis',
      value: 3,
      icon: Scan,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      label: 'High Risk Cases',
      value: mockPatients.filter((p) => p.riskLevel === 'high').length,
      icon: AlertTriangle,
      color: 'text-risk-high',
      bgColor: 'bg-risk-high/10',
    },
    {
      label: 'Vitals Recorded Today',
      value: 12,
      icon: Activity,
      color: 'text-risk-low',
      bgColor: 'bg-risk-low/10',
    },
  ];

  const recentPatients = mockPatients.slice(0, 4);
  const highRiskPatients = mockPatients.filter((p) => p.riskLevel === 'high');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Welcome back, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your clinical dashboard
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
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="metric-card animate-slide-up"
              style={{ animationDelay: `${stats.indexOf(stat) * 50}ms` }}
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
              {recentPatients.map((patient, i) => (
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
                      {patient.age} years • {patient.gender} • {patient.bloodGroup}
                    </p>
                  </div>
                  <RiskBadge level={patient.riskLevel} size="sm" />
                </Link>
              ))}
            </div>
          </div>

          {/* Alerts panel */}
          <div className="bg-card rounded-xl border border-border shadow-soft">
            <div className="p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-risk-high" />
                High Risk Alerts
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {highRiskPatients.length > 0 ? (
                highRiskPatients.map((patient, i) => {
                  const vitals = mockVitals[patient.id]?.[0];
                  const xray = mockXRayAnalyses[patient.id]?.[0];
                  const risk = calculateRiskAssessment(vitals, xray);

                  return (
                    <Link
                      key={patient.id}
                      to={`/patients/${patient.id}`}
                      className="block p-3 rounded-lg bg-risk-high/5 border border-risk-high/20 hover:border-risk-high/40 transition-colors animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <span className="text-xs text-risk-high font-medium">{risk.fusedScore}% Risk</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {risk.explanation}
                      </p>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No high-risk patients currently</p>
                </div>
              )}
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
                Upload X-Ray
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
              <p className="font-semibold text-foreground">
                Medical Records
              </p>
              <p className="text-sm text-muted-foreground">View patient history</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
