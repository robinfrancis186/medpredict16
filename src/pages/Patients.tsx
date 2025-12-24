import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PatientRegistrationForm } from '@/components/PatientRegistrationForm';
import { PatientSearchFilters, PatientFilters } from '@/components/PatientSearchFilters';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RiskBadge } from '@/components/RiskBadge';
import {
  Plus,
  ChevronRight,
  AlertCircle,
  Calendar,
  Loader2,
  Users,
} from 'lucide-react';

interface Patient {
  id: string;
  patient_id: string | null;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  allergies: string[];
  chronic_conditions: string[];
  created_at: string;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<PatientFilters>({
    searchQuery: '',
    bloodGroup: 'all',
    riskLevel: 'all',
  });
  const [showRegistration, setShowRegistration] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Calculate risk level based on conditions and allergies
  const getRiskLevel = (patient: Patient): 'low' | 'medium' | 'high' => {
    const riskFactors = patient.allergies.length + patient.chronic_conditions.length;
    if (riskFactors >= 3) return 'high';
    if (riskFactors >= 1) return 'medium';
    return 'low';
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      // Search filter (name or patient ID)
      const searchMatch =
        filters.searchQuery === '' ||
        patient.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        (patient.patient_id && patient.patient_id.toLowerCase().includes(filters.searchQuery.toLowerCase()));

      // Blood group filter
      const bloodGroupMatch =
        filters.bloodGroup === 'all' || patient.blood_group === filters.bloodGroup;

      // Risk level filter
      const patientRisk = getRiskLevel(patient);
      const riskMatch = filters.riskLevel === 'all' || patientRisk === filters.riskLevel;

      return searchMatch && bloodGroupMatch && riskMatch;
    });
  }, [patients, filters]);

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
              {filteredPatients.length} of {patients.length} patients
            </p>
          </div>
          <Button variant="medical" onClick={() => setShowRegistration(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Search and Filters */}
        <PatientSearchFilters onFiltersChange={setFilters} />

        {/* Patient list */}
        <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Patient</div>
            <div className="col-span-2">Age / Gender</div>
            <div className="col-span-2">Blood Group</div>
            <div className="col-span-2">Registered</div>
            <div className="col-span-2">Risk Level</div>
          </div>

          {/* Patient rows */}
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPatients.length > 0 ? (
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
                        <p className="text-xs text-muted-foreground font-mono">{patient.patient_id || 'ID pending'}</p>
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
                        {patient.blood_group}
                      </span>
                    </div>

                    {/* Registered date */}
                    <div className="md:col-span-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(patient.created_at).toLocaleDateString()}
                    </div>

                    {/* Risk level */}
                    <div className="md:col-span-2 flex items-center justify-between">
                      <RiskBadge level={getRiskLevel(patient)} size="sm" />
                      <ChevronRight className="w-5 h-5 text-muted-foreground hidden md:block" />
                    </div>

                    {/* Mobile: Conditions */}
                    {(patient.allergies.length > 0 || patient.chronic_conditions.length > 0) && (
                      <div className="md:hidden col-span-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="w-3.5 h-3.5 text-risk-medium" />
                        {[...patient.allergies, ...patient.chronic_conditions].slice(0, 2).join(', ')}
                        {[...patient.allergies, ...patient.chronic_conditions].length > 2 && ' +more'}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {filters.searchQuery || filters.bloodGroup !== 'all' || filters.riskLevel !== 'all'
                    ? 'No patients found matching your filters'
                    : 'No patients registered yet'}
                </p>
                <Button variant="outline" className="mt-4" onClick={() => setShowRegistration(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Register First Patient
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Registration form dialog */}
        <PatientRegistrationForm
          open={showRegistration}
          onOpenChange={setShowRegistration}
          onSuccess={fetchPatients}
        />
      </div>
    </DashboardLayout>
  );
}
