import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User, Phone, Droplets, AlertTriangle, Heart, Plus, X, Loader2 } from 'lucide-react';

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  age: z.number().min(1, 'Age must be at least 1').max(150, 'Age must be less than 150'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select a gender' }),
  blood_group: z.string().min(1, 'Blood group is required'),
  emergency_contact: z.string().min(10, 'Please enter a valid phone number').max(20, 'Phone number too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PatientRegistrationForm({ open, onOpenChange, onSuccess }: PatientRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
  });

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy));
  };

  const addCondition = () => {
    if (newCondition.trim() && !chronicConditions.includes(newCondition.trim())) {
      setChronicConditions([...chronicConditions, newCondition.trim()]);
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setChronicConditions(chronicConditions.filter((c) => c !== condition));
  };

  const onSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('patients').insert({
        name: data.name,
        age: data.age,
        gender: data.gender,
        blood_group: data.blood_group,
        emergency_contact: data.emergency_contact,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        date_of_birth: data.date_of_birth || null,
        allergies: allergies,
        chronic_conditions: chronicConditions,
      });

      if (error) throw error;

      toast.success('Patient registered successfully', {
        description: `${data.name} has been added to the system.`,
      });

      reset();
      setAllergies([]);
      setChronicConditions([]);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error registering patient:', error);
      toast.error('Failed to register patient', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Register New Patient
          </DialogTitle>
          <DialogDescription>
            Enter patient details to add them to the medical system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="45"
                  {...register('age', { valueAsNumber: true })}
                  className={errors.age ? 'border-destructive' : ''}
                />
                {errors.age && (
                  <p className="text-xs text-destructive">{errors.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select onValueChange={(value) => setValue('gender', value as any)}>
                  <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-xs text-destructive">{errors.gender.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="blood_group">Blood Group *</Label>
                <Select onValueChange={(value) => setValue('blood_group', value)}>
                  <SelectTrigger className={errors.blood_group ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.blood_group && (
                  <p className="text-xs text-destructive">{errors.blood_group.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  {...register('date_of_birth')}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact *</Label>
                <Input
                  id="emergency_contact"
                  placeholder="+1 (555) 123-4567"
                  {...register('emergency_contact')}
                  className={errors.emergency_contact ? 'border-destructive' : ''}
                />
                {errors.emergency_contact && (
                  <p className="text-xs text-destructive">{errors.emergency_contact.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 987-6543"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="patient@email.com"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="123 Main St, City, State, ZIP"
                  {...register('address')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-risk-medium" />
              Critical Medical Information
            </h3>

            {/* Allergies */}
            <div className="space-y-2">
              <Label>Allergies</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add allergy (e.g., Penicillin)"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                />
                <Button type="button" variant="outline" onClick={addAllergy}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-risk-high/10 text-risk-high text-sm"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="hover:bg-risk-high/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Chronic Conditions
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add condition (e.g., Diabetes)"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCondition())}
                />
                <Button type="button" variant="outline" onClick={addCondition}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {chronicConditions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {chronicConditions.map((condition) => (
                    <span
                      key={condition}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-risk-medium/10 text-risk-medium text-sm"
                    >
                      {condition}
                      <button
                        type="button"
                        onClick={() => removeCondition(condition)}
                        className="hover:bg-risk-medium/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="medical" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Register Patient
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
