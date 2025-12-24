import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockPatients } from '@/data/mockData';
import { RiskBadge } from '@/components/RiskBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filteredPatients = mockPatients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || patient.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Patient Directory
            </h1>
            <p className="text-muted-foreground mt-1">
              {mockPatients.length} patients in the system
            </p>
          </div>
          <Button variant="medical">
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
              <Button
                key={filter}
                variant={riskFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRiskFilter(filter)}
                className="capitalize"
              >
                {filter === 'all' ? 'All Risk' : `${filter} Risk`}
              </Button>
            ))}
          </div>
        </div>

        {/* Patient list */}
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Patient</div>
            <div className="col-span-2">Age / Gender</div>
            <div className="col-span-2">Blood Group</div>
            <div className="col-span-2">Last Visit</div>
            <div className="col-span-2">Risk Level</div>
          </div>

          {/* Patient rows */}
          <div className="divide-y divide-border">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient, i) => (
                <Link
                  key={patient.id}
                  to={`/patients/${patient.id}`}
                  className="block hover:bg-muted/50 transition-colors animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center">
                    {/* Patient info */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {patient.name.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {patient.id}</p>
                      </div>
                    </div>

                    {/* Age / Gender */}
                    <div className="md:col-span-2">
                      <p className="text-sm text-foreground capitalize">
                        {patient.age} years • {patient.gender}
                      </p>
                    </div>

                    {/* Blood group */}
                    <div className="md:col-span-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 text-primary text-sm font-medium">
                        {patient.bloodGroup}
                      </span>
                    </div>

                    {/* Last visit */}
                    <div className="md:col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(patient.lastVisit).toLocaleDateString()}
                    </div>

                    {/* Risk level */}
                    <div className="md:col-span-2 flex items-center justify-between">
                      <RiskBadge level={patient.riskLevel} size="sm" />
                      <ChevronRight className="w-5 h-5 text-muted-foreground hidden md:block" />
                    </div>

                    {/* Mobile: Conditions */}
                    {(patient.allergies.length > 0 || patient.chronicConditions.length > 0) && (
                      <div className="md:hidden col-span-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="w-3.5 h-3.5 text-risk-medium" />
                        {[...patient.allergies, ...patient.chronicConditions].slice(0, 2).join(', ')}
                        {[...patient.allergies, ...patient.chronicConditions].length > 2 && ' +more'}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No patients found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
