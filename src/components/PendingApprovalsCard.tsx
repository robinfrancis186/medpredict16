import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserCheck, UserX, Clock, Loader2, User } from 'lucide-react';

interface PendingPatient {
  id: string;
  patient_id: string | null;
  name: string;
  email: string | null;
  age: number;
  gender: string;
  created_at: string;
}

export function PendingApprovalsCard() {
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_id, name, email, age, gender, created_at')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingPatients(data || []);
    } catch (error) {
      console.error('Error fetching pending patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPatients();
  }, []);

  const handleApproval = async (patientId: string, approve: boolean) => {
    setProcessingId(patientId);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ approval_status: approve ? 'approved' : 'rejected' })
        .eq('id', patientId);

      if (error) throw error;

      toast.success(approve ? 'Patient approved' : 'Registration rejected');
      fetchPendingPatients();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update', { description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (pendingPatients.length === 0) {
    return null;
  }

  return (
    <Card className="border-risk-medium/30 bg-risk-medium/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-risk-medium" />
              Pending Registrations
            </CardTitle>
            <CardDescription>
              {pendingPatients.length} patient{pendingPatients.length !== 1 ? 's' : ''} awaiting approval
            </CardDescription>
          </div>
          <Badge className="bg-risk-medium/20 text-risk-medium">
            {pendingPatients.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingPatients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-background border"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{patient.name}</p>
              <p className="text-sm text-muted-foreground">
                {patient.age} years • {patient.gender} • {patient.email || 'No email'}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {patient.patient_id || 'ID pending'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApproval(patient.id, false)}
                disabled={processingId === patient.id}
                className="text-destructive hover:text-destructive"
              >
                {processingId === patient.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="medical"
                onClick={() => handleApproval(patient.id, true)}
                disabled={processingId === patient.id}
              >
                {processingId === patient.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}