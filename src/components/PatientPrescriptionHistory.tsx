import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, Clock, CheckCircle, AlertCircle, Building2, Send } from 'lucide-react';

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  pharmacy_name: string;
  pharmacy_address: string;
  status: 'draft' | 'transmitted' | 'filled' | 'cancelled';
  created_at: string;
  transmitted_at?: string;
}

interface PatientPrescriptionHistoryProps {
  patientId: string;
  patientName: string;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  draft: { color: 'bg-muted text-muted-foreground', icon: AlertCircle, label: 'Draft' },
  transmitted: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock, label: 'Transmitted' },
  filled: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle, label: 'Filled' },
  cancelled: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle, label: 'Cancelled' },
};

export function PatientPrescriptionHistory({ patientId, patientName }: PatientPrescriptionHistoryProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data - in production this would fetch from database
    const fetchPrescriptions = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock prescriptions for this patient
      const mockData: Prescription[] = [
        {
          id: 'rx-001',
          medication_name: 'Amoxicillin 500mg',
          dosage: '1 capsule',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'Take with food. Complete full course.',
          pharmacy_name: 'City Pharmacy',
          pharmacy_address: '123 Main St, Downtown',
          status: 'filled',
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          transmitted_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
        {
          id: 'rx-002',
          medication_name: 'Lisinopril 10mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take in the morning. Monitor blood pressure regularly.',
          pharmacy_name: 'HealthMart',
          pharmacy_address: '456 Oak Ave, Midtown',
          status: 'transmitted',
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          transmitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
        {
          id: 'rx-003',
          medication_name: 'Metformin 850mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '90 days',
          instructions: 'Take with meals to reduce stomach upset.',
          pharmacy_name: 'MedPlus Pharmacy',
          pharmacy_address: '789 Pine Rd, Uptown',
          status: 'filled',
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          transmitted_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
        {
          id: 'rx-004',
          medication_name: 'Atorvastatin 20mg',
          dosage: '1 tablet',
          frequency: 'Once daily at bedtime',
          duration: '90 days',
          instructions: 'Take at night for best results.',
          pharmacy_name: 'City Pharmacy',
          pharmacy_address: '123 Main St, Downtown',
          status: 'draft',
          created_at: new Date().toISOString(),
        },
      ];
      
      setPrescriptions(mockData);
      setIsLoading(false);
    };

    fetchPrescriptions();
  }, [patientId]);

  const handleTransmit = (prescriptionId: string) => {
    setPrescriptions(prev =>
      prev.map(rx =>
        rx.id === prescriptionId
          ? { ...rx, status: 'transmitted' as const, transmitted_at: new Date().toISOString() }
          : rx
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <Pill className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No prescriptions found for this patient</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''} on record
        </p>
      </div>

      <div className="space-y-3">
        {prescriptions.map((rx) => {
          const statusInfo = statusConfig[rx.status];
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={rx.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
                  {/* Medication Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Pill className="w-6 h-6 text-primary" />
                  </div>

                  {/* Medication Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">{rx.medication_name}</h4>
                      <Badge variant="outline" className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rx.dosage} • {rx.frequency} • {rx.duration}
                    </p>
                    {rx.instructions && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{rx.instructions}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {rx.pharmacy_name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(rx.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {rx.status === 'draft' && (
                    <Button size="sm" onClick={() => handleTransmit(rx.id)} className="gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      Transmit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Demo Notice */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-500 text-sm">Demo Data</h4>
            <p className="text-xs text-muted-foreground">
              This is sample prescription history. In production, this would display actual 
              prescriptions from the patient's medical record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
