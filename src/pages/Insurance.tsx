import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw,
  AlertCircle,
  CreditCard,
  User,
  Calendar
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
}

interface InsuranceRecord {
  id: string;
  patient_id: string;
  patient_name?: string;
  insurance_provider: string;
  policy_number: string;
  group_number: string;
  subscriber_name: string;
  subscriber_dob: string;
  relationship: string;
  verified_at?: string;
  status: 'pending' | 'verified' | 'invalid' | 'expired';
  coverage_type: string;
  copay?: string;
  deductible?: string;
  deductible_met?: string;
}

const insuranceProviders = [
  'Blue Cross Blue Shield',
  'Aetna',
  'UnitedHealthcare',
  'Cigna',
  'Humana',
  'Kaiser Permanente',
  'Medicare',
  'Medicaid',
  'Other',
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  pending: { color: 'bg-muted text-muted-foreground', icon: Clock },
  verified: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  invalid: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  expired: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle },
};

export default function Insurance() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    patient_id: '',
    insurance_provider: '',
    policy_number: '',
    group_number: '',
    subscriber_name: '',
    subscriber_dob: '',
    relationship: 'self',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');
      setPatients(patientsData || []);

      // Mock insurance records
      const mockRecords: InsuranceRecord[] = [
        {
          id: 'ins-001',
          patient_id: patientsData?.[0]?.id || '',
          patient_name: patientsData?.[0]?.name || 'Unknown',
          insurance_provider: 'Blue Cross Blue Shield',
          policy_number: 'XYZ123456789',
          group_number: 'GRP-001',
          subscriber_name: patientsData?.[0]?.name || 'Unknown',
          subscriber_dob: '1985-03-15',
          relationship: 'self',
          verified_at: new Date().toISOString(),
          status: 'verified',
          coverage_type: 'PPO',
          copay: '$25',
          deductible: '$1,500',
          deductible_met: '$850',
        },
        {
          id: 'ins-002',
          patient_id: patientsData?.[1]?.id || '',
          patient_name: patientsData?.[1]?.name || 'Unknown',
          insurance_provider: 'Aetna',
          policy_number: 'AET987654321',
          group_number: 'GRP-042',
          subscriber_name: 'Robert Johnson',
          subscriber_dob: '1960-08-20',
          relationship: 'spouse',
          status: 'pending',
          coverage_type: 'HMO',
        },
      ];
      setRecords(mockRecords);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.patient_id || !formData.insurance_provider || !formData.policy_number) {
      toast.error('Please fill in required fields');
      return;
    }

    const patient = patients.find(p => p.id === formData.patient_id);
    
    const newRecord: InsuranceRecord = {
      id: `ins-${Date.now()}`,
      patient_id: formData.patient_id,
      patient_name: patient?.name || 'Unknown',
      insurance_provider: formData.insurance_provider,
      policy_number: formData.policy_number,
      group_number: formData.group_number,
      subscriber_name: formData.subscriber_name || patient?.name || '',
      subscriber_dob: formData.subscriber_dob,
      relationship: formData.relationship,
      status: 'pending',
      coverage_type: 'Unknown',
    };

    setRecords(prev => [newRecord, ...prev]);
    setIsDialogOpen(false);
    setFormData({
      patient_id: '',
      insurance_provider: '',
      policy_number: '',
      group_number: '',
      subscriber_name: '',
      subscriber_dob: '',
      relationship: 'self',
    });
    
    toast.success('Insurance information saved', {
      description: 'Ready for eligibility verification',
    });
  };

  const handleVerify = async (record: InsuranceRecord) => {
    setIsVerifying(record.id);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock verification result (random success/fail for demo)
    const isEligible = Math.random() > 0.2;
    
    setRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? {
              ...r,
              status: isEligible ? 'verified' : 'invalid',
              verified_at: new Date().toISOString(),
              coverage_type: isEligible ? 'PPO' : r.coverage_type,
              copay: isEligible ? '$' + (Math.floor(Math.random() * 4) * 10 + 20) : undefined,
              deductible: isEligible ? '$' + (Math.floor(Math.random() * 3) * 500 + 1000) : undefined,
              deductible_met: isEligible ? '$' + Math.floor(Math.random() * 1000) : undefined,
            }
          : r
      )
    );
    
    setIsVerifying(null);
    
    if (isEligible) {
      toast.success('Insurance verified', {
        description: 'Patient is eligible for coverage',
      });
    } else {
      toast.error('Verification failed', {
        description: 'Insurance information could not be verified',
      });
    }
  };

  const filteredRecords = records.filter(r =>
    r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.insurance_provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.policy_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Insurance Verification</h1>
            <p className="text-muted-foreground">Verify patient insurance eligibility in real-time</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Insurance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Add Insurance Information
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select
                      value={formData.patient_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, patient_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Provider *</Label>
                    <Select
                      value={formData.insurance_provider}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, insurance_provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceProviders.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Policy Number *</Label>
                    <Input
                      value={formData.policy_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
                      placeholder="e.g., XYZ123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Group Number</Label>
                    <Input
                      value={formData.group_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, group_number: e.target.value }))}
                      placeholder="e.g., GRP-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Subscriber Name</Label>
                    <Input
                      value={formData.subscriber_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, subscriber_name: e.target.value }))}
                      placeholder="Policy holder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subscriber DOB</Label>
                    <Input
                      type="date"
                      value={formData.subscriber_dob}
                      onChange={(e) => setFormData(prev => ({ ...prev, subscriber_dob: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select
                      value={formData.relationship}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Save Insurance</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, provider, or policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Insurance Records */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </CardContent>
            </Card>
          ) : filteredRecords.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No insurance records found</p>
              </CardContent>
            </Card>
          ) : (
            filteredRecords.map((record) => {
              const StatusIcon = statusConfig[record.status]?.icon || Clock;
              return (
                <Card key={record.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{record.patient_name}</h3>
                              <Badge variant="outline" className={statusConfig[record.status]?.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{record.insurance_provider}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Policy #</p>
                              <p className="font-mono">{record.policy_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Group #</p>
                              <p className="font-mono">{record.group_number || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Subscriber</p>
                              <p>{record.subscriber_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Relationship</p>
                              <p className="capitalize">{record.relationship}</p>
                            </div>
                          </div>
                        </div>

                        {record.status === 'verified' && (
                          <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                            <h4 className="font-medium text-green-500 mb-2">Coverage Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Plan Type</p>
                                <p className="font-medium">{record.coverage_type}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Copay</p>
                                <p className="font-medium">{record.copay}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Deductible</p>
                                <p className="font-medium">{record.deductible}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Deductible Met</p>
                                <p className="font-medium">{record.deductible_met}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant={record.status === 'verified' ? 'outline' : 'default'}
                          onClick={() => handleVerify(record)}
                          disabled={isVerifying === record.id}
                          className="gap-2"
                        >
                          {isVerifying === record.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              {record.status === 'verified' ? 'Re-verify' : 'Verify Eligibility'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Demo Notice */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-500">Demo Mode</h4>
                <p className="text-sm text-muted-foreground">
                  This is a demonstration interface. In production, this would integrate with 
                  clearinghouses like Availity or Change Healthcare for real-time insurance 
                  eligibility verification via X12 270/271 transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
