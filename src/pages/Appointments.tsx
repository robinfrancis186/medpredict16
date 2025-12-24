import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { format, startOfDay, addHours, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Plus, User, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  full_name: string;
  department: string | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  department: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  patients?: { name: string };
  doctor_profile?: { full_name: string };
}

const DEPARTMENTS = [
  'Radiology',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'General Medicine',
  'Pulmonology',
  'Oncology',
  'Emergency'
];

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-chart-2 text-chart-2-foreground';
    case 'completed': return 'bg-muted text-muted-foreground';
    case 'cancelled': return 'bg-destructive/20 text-destructive';
    default: return 'bg-primary/20 text-primary';
  }
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments();
    }
  }, [selectedDate]);

  const fetchData = async () => {
    // Fetch patients
    const { data: patientsData } = await supabase
      .from('patients')
      .select('id, name')
      .order('name');
    
    setPatients(patientsData || []);

    // Fetch doctors
    const { data: doctorsData } = await supabase
      .from('profiles')
      .select('id, full_name, department, user_id')
      .order('full_name');

    // Filter to only doctors
    const doctorProfiles = [];
    for (const profile of doctorsData || []) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.user_id)
        .single();
      
      if (roleData?.role === 'doctor') {
        doctorProfiles.push({
          id: profile.user_id,
          full_name: profile.full_name,
          department: profile.department
        });
      }
    }
    setDoctors(doctorProfiles);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    const startOfSelectedDay = startOfDay(selectedDate);
    const endOfSelectedDay = addHours(startOfSelectedDay, 24);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients:patient_id(name)
      `)
      .gte('scheduled_at', startOfSelectedDay.toISOString())
      .lt('scheduled_at', endOfSelectedDay.toISOString())
      .order('scheduled_at');

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      // Fetch doctor names separately
      const appointmentsWithDoctors = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', apt.doctor_id)
            .single();
          
          return {
            ...apt,
            doctor_profile: profileData
          };
        })
      );
      setAppointments(appointmentsWithDoctors);
    }
    setLoading(false);
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedDepartment || !selectedTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const scheduledAt = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const { error } = await supabase
      .from('appointments')
      .insert({
        patient_id: selectedPatient,
        doctor_id: selectedDoctor,
        department: selectedDepartment,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(duration),
        notes: notes || null
      });

    if (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Appointment Created",
        description: `Scheduled for ${format(scheduledAt, 'PPp')}`
      });

      // Create notification for the doctor
      const patient = patients.find(p => p.id === selectedPatient);
      await createNotification(
        selectedDoctor,
        'New Appointment Scheduled',
        `Appointment with ${patient?.name} on ${format(scheduledAt, 'PPp')}`,
        'appointment_reminder',
        selectedPatient
      );

      setDialogOpen(false);
      resetForm();
      fetchAppointments();
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Status Updated",
        description: `Appointment marked as ${newStatus}`
      });
      fetchAppointments();
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setSelectedDoctor('');
    setSelectedDepartment('');
    setSelectedTime('');
    setDuration('30');
    setNotes('');
  };

  // Filter doctors by selected department
  const filteredDoctors = selectedDepartment
    ? doctors.filter(d => d.department === selectedDepartment || !d.department)
    : doctors;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">Manage patient appointments and schedules</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          Dr. {doctor.full_name} {doctor.department && `(${doctor.department})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about the appointment..."
                  />
                </div>

                <Button className="w-full" onClick={handleCreateAppointment}>
                  Schedule Appointment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Day Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              <CardDescription>
                {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading appointments...
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments scheduled for this day
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex flex-col items-center text-center min-w-[60px]">
                        <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-sm font-medium">
                          {format(new Date(appointment.scheduled_at), 'HH:mm')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {appointment.duration_minutes} min
                        </span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {appointment.patients?.name}
                            </span>
                          </div>
                          <Badge className={cn(getStatusColor(appointment.status))}>
                            {appointment.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {appointment.department}
                          </span>
                          <span>
                            Dr. {appointment.doctor_profile?.full_name}
                          </span>
                        </div>
                        
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground">
                            {appointment.notes}
                          </p>
                        )}
                        
                        {appointment.status === 'scheduled' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
