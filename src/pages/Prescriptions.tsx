import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Pill, Plus, Send, Clock, CheckCircle, AlertCircle, Building2, Search } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
}

interface Prescription {
  id: string;
  patient_id: string;
  patient_name?: string;
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

const mockPharmacies = [
  { id: '1', name: 'City Pharmacy', address: '123 Main St, Downtown' },
  { id: '2', name: 'HealthMart', address: '456 Oak Ave, Midtown' },
  { id: '3', name: 'MedPlus Pharmacy', address: '789 Pine Rd, Uptown' },
  { id: '4', name: 'QuickCare Rx', address: '321 Elm St, Eastside' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  transmitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  filled: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function Prescriptions() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(mockPharmacies[0]);
  
  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    pharmacy_id: '1',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('id, name')
        .order('name');
      setPatients(patientsData || []);

      // Mock prescriptions (in real app, would fetch from database)
      const mockPrescriptions: Prescription[] = [
        {
          id: 'rx-001',
          patient_id: patientsData?.[0]?.id || '',
          patient_name: patientsData?.[0]?.name || 'Unknown',
          medication_name: 'Amoxicillin 500mg',
          dosage: '1 capsule',
          frequency: 'Three times daily',
          duration: '7 days',
          instructions: 'Take with food. Complete full course.',
          pharmacy_name: 'City Pharmacy',
          pharmacy_address: '123 Main St, Downtown',
          status: 'transmitted',
          created_at: new Date().toISOString(),
          transmitted_at: new Date().toISOString(),
        },
        {
          id: 'rx-002',
          patient_id: patientsData?.[1]?.id || '',
          patient_name: patientsData?.[1]?.name || 'Unknown',
          medication_name: 'Lisinopril 10mg',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take in the morning. Monitor blood pressure.',
          pharmacy_name: 'HealthMart',
          pharmacy_address: '456 Oak Ave, Midtown',
          status: 'filled',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          transmitted_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setPrescriptions(mockPrescriptions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (transmit: boolean) => {
    if (!formData.patient_id || !formData.medication_name || !formData.dosage) {
      toast.error('Please fill in required fields');
      return;
    }

    const pharmacy = mockPharmacies.find(p => p.id === formData.pharmacy_id) || mockPharmacies[0];
    const patient = patients.find(p => p.id === formData.patient_id);
    
    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      patient_id: formData.patient_id,
      patient_name: patient?.name || 'Unknown',
      medication_name: formData.medication_name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      instructions: formData.instructions,
      pharmacy_name: pharmacy.name,
      pharmacy_address: pharmacy.address,
      status: transmit ? 'transmitted' : 'draft',
      created_at: new Date().toISOString(),
      transmitted_at: transmit ? new Date().toISOString() : undefined,
    };

    setPrescriptions(prev => [newPrescription, ...prev]);
    setIsDialogOpen(false);
    setFormData({
      patient_id: '',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      pharmacy_id: '1',
    });

    if (transmit) {
      toast.success('Prescription transmitted to pharmacy', {
        description: `Sent to ${pharmacy.name}`,
      });
    } else {
      toast.success('Prescription saved as draft');
    }
  };

  const handleTransmit = (prescription: Prescription) => {
    setPrescriptions(prev =>
      prev.map(p =>
        p.id === prescription.id
          ? { ...p, status: 'transmitted' as const, transmitted_at: new Date().toISOString() }
          : p
      )
    );
    toast.success('Prescription transmitted', {
      description: `Sent to ${prescription.pharmacy_name}`,
    });
  };

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prescription Transmission</h1>
            <p className="text-muted-foreground">Create and send prescriptions to pharmacies</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Create Prescription
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
                    <Label>Pharmacy</Label>
                    <Select
                      value={formData.pharmacy_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, pharmacy_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockPharmacies.map((pharmacy) => (
                          <SelectItem key={pharmacy.id} value={pharmacy.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {pharmacy.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Medication Name *</Label>
                  <Input
                    value={formData.medication_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                    placeholder="e.g., Amoxicillin 500mg capsules"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Dosage *</Label>
                    <Input
                      value={formData.dosage}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 1 tablet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="Four times daily">Four times daily</SelectItem>
                        <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                        <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Instructions</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Special instructions for the patient..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => handleSubmit(false)}>
                  Save Draft
                </Button>
                <Button onClick={() => handleSubmit(true)} className="gap-2">
                  <Send className="w-4 h-4" />
                  Transmit to Pharmacy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prescriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Prescriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Prescriptions</CardTitle>
            <CardDescription>Manage and track prescription transmissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No prescriptions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Pharmacy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((rx) => (
                    <TableRow key={rx.id}>
                      <TableCell className="font-medium">{rx.patient_name}</TableCell>
                      <TableCell>{rx.medication_name}</TableCell>
                      <TableCell>{rx.dosage} - {rx.frequency}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{rx.pharmacy_name}</p>
                          <p className="text-muted-foreground text-xs">{rx.pharmacy_address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[rx.status]}>
                          {rx.status === 'transmitted' && <Clock className="w-3 h-3 mr-1" />}
                          {rx.status === 'filled' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {rx.status === 'draft' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {rx.status.charAt(0).toUpperCase() + rx.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {rx.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleTransmit(rx)}
                            className="gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Transmit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-500">Demo Mode</h4>
                <p className="text-sm text-muted-foreground">
                  This is a demonstration interface. In production, this would integrate with 
                  e-prescribing networks like Surescripts for real-time prescription transmission 
                  to pharmacies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
