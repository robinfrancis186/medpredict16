import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type GenderType = Database['public']['Enums']['gender_type'];

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  blood_group: string;
  emergency_contact: string;
  allergies: string[];
  chronic_conditions: string[];
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface PatientEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onSuccess: () => void;
}

export function PatientEditDialog({ open, onOpenChange, patient, onSuccess }: PatientEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    gender: 'male' as GenderType,
    blood_group: '',
    emergency_contact: '',
    email: '',
    phone: '',
    address: '',
    allergies: [] as string[],
    chronic_conditions: [] as string[],
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        age: patient.age,
        gender: patient.gender as GenderType,
        blood_group: patient.blood_group,
        emergency_contact: patient.emergency_contact,
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        allergies: patient.allergies || [],
        chronic_conditions: patient.chronic_conditions || [],
      });
    }
  }, [patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          blood_group: formData.blood_group,
          emergency_contact: formData.emergency_contact,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          allergies: formData.allergies,
          chronic_conditions: formData.chronic_conditions,
        })
        .eq('id', patient.id);

      if (error) throw error;

      toast.success('Patient updated', { description: 'Patient details have been saved.' });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error('Update failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !formData.allergies.includes(newAllergy.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, newAllergy.trim()] });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setFormData({ ...formData, allergies: formData.allergies.filter(a => a !== allergy) });
  };

  const addCondition = () => {
    if (newCondition.trim() && !formData.chronic_conditions.includes(newCondition.trim())) {
      setFormData({ ...formData, chronic_conditions: [...formData.chronic_conditions, newCondition.trim()] });
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setFormData({ ...formData, chronic_conditions: formData.chronic_conditions.filter(c => c !== condition) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as GenderType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group</Label>
              <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-2">
            <Label>Allergies</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add allergy..."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addAllergy}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergies.map((allergy) => (
                  <span key={allergy} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-risk-high/10 text-risk-high text-sm">
                    {allergy}
                    <button type="button" onClick={() => removeAllergy(allergy)} className="hover:bg-risk-high/20 rounded p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Chronic Conditions */}
          <div className="space-y-2">
            <Label>Chronic Conditions</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add condition..."
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addCondition}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.chronic_conditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.chronic_conditions.map((condition) => (
                  <span key={condition} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-risk-medium/10 text-risk-medium text-sm">
                    {condition}
                    <button type="button" onClick={() => removeCondition(condition)} className="hover:bg-risk-medium/20 rounded p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
