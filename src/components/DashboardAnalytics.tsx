import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Loader2, Users, TrendingUp, Calendar, Activity } from 'lucide-react';

interface RiskDistribution {
  name: string;
  value: number;
  color: string;
}

interface AppointmentTrend {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
}

interface BloodGroupStats {
  blood_group: string;
  count: number;
}

interface GenderStats {
  gender: string;
  count: number;
}

export function DashboardAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution[]>([]);
  const [bloodGroupStats, setBloodGroupStats] = useState<BloodGroupStats[]>([]);
  const [genderStats, setGenderStats] = useState<GenderStats[]>([]);
  const [appointmentTrends, setAppointmentTrends] = useState<AppointmentTrend[]>([]);
  const [patientGrowth, setPatientGrowth] = useState<{ month: string; patients: number }[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch patients for risk calculation
      const { data: patients } = await supabase
        .from('patients')
        .select('id, allergies, chronic_conditions, blood_group, gender, created_at');

      if (patients) {
        // Calculate risk distribution based on allergies and chronic conditions
        let high = 0, medium = 0, low = 0;
        patients.forEach(p => {
          const riskFactors = (p.allergies?.length || 0) + (p.chronic_conditions?.length || 0);
          if (riskFactors >= 3) high++;
          else if (riskFactors >= 1) medium++;
          else low++;
        });

        setRiskDistribution([
          { name: 'High Risk', value: high, color: 'hsl(0, 84%, 60%)' },
          { name: 'Medium Risk', value: medium, color: 'hsl(45, 93%, 47%)' },
          { name: 'Low Risk', value: low, color: 'hsl(142, 71%, 45%)' },
        ]);

        // Blood group distribution
        const bloodGroups: Record<string, number> = {};
        patients.forEach(p => {
          bloodGroups[p.blood_group] = (bloodGroups[p.blood_group] || 0) + 1;
        });
        setBloodGroupStats(Object.entries(bloodGroups).map(([blood_group, count]) => ({ blood_group, count })));

        // Gender distribution
        const genders: Record<string, number> = {};
        patients.forEach(p => {
          const g = p.gender.charAt(0).toUpperCase() + p.gender.slice(1);
          genders[g] = (genders[g] || 0) + 1;
        });
        setGenderStats(Object.entries(genders).map(([gender, count]) => ({ gender, count })));

        // Patient growth by month (last 6 months)
        const monthlyGrowth: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          monthlyGrowth[key] = 0;
        }
        patients.forEach(p => {
          const d = new Date(p.created_at);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (monthlyGrowth.hasOwnProperty(key)) {
            monthlyGrowth[key]++;
          }
        });
        setPatientGrowth(Object.entries(monthlyGrowth).map(([month, patients]) => ({ month, patients })));
      }

      // Fetch appointments for trends
      const { data: appointments } = await supabase
        .from('appointments')
        .select('scheduled_at, status')
        .gte('scheduled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (appointments) {
        const trendMap: Record<string, { scheduled: number; completed: number; cancelled: number }> = {};
        
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString('en-US', { weekday: 'short' });
          trendMap[key] = { scheduled: 0, completed: 0, cancelled: 0 };
        }

        appointments.forEach(apt => {
          const d = new Date(apt.scheduled_at);
          const key = d.toLocaleDateString('en-US', { weekday: 'short' });
          if (trendMap[key]) {
            if (apt.status === 'completed') trendMap[key].completed++;
            else if (apt.status === 'cancelled') trendMap[key].cancelled++;
            else trendMap[key].scheduled++;
          }
        });

        setAppointmentTrends(Object.entries(trendMap).map(([date, stats]) => ({ date, ...stats })));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 71%, 45%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)', 'hsl(280, 87%, 65%)', 'hsl(200, 98%, 45%)', 'hsl(30, 95%, 55%)'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-display font-semibold text-foreground">Analytics Overview</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-risk-medium" />
            Patient Risk Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Blood Group Distribution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-risk-high" />
            Blood Group Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bloodGroupStats} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="blood_group" width={40} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {bloodGroupStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Gender Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="count"
                  label={({ gender, percent }) => `${gender}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {genderStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Patient Growth */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-risk-low" />
            Patient Registration Trend
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="patients" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appointment Trends */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-soft">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            Weekly Appointment Status
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="scheduled" name="Scheduled" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
