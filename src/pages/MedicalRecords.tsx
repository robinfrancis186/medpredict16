import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockPatients, mockMedicalRecords } from '@/data/mockData';
import {
  FileText,
  Search,
  Upload,
  Calendar,
  Building2,
  Download,
  Share2,
  Eye,
  Clock,
  Filter,
} from 'lucide-react';

const recordTypeLabels: Record<string, string> = {
  discharge_summary: 'Discharge Summary',
  diagnosis: 'Diagnosis',
  xray_report: 'X-Ray Report',
  ct_report: 'CT Report',
  prescription: 'Prescription',
  lab_result: 'Lab Result',
};

const recordTypeColors: Record<string, string> = {
  discharge_summary: 'bg-primary/10 text-primary',
  diagnosis: 'bg-secondary/10 text-secondary',
  xray_report: 'bg-risk-medium/10 text-risk-medium',
  ct_report: 'bg-risk-medium/10 text-risk-medium',
  prescription: 'bg-risk-low/10 text-risk-low',
  lab_result: 'bg-accent text-accent-foreground',
};

export default function MedicalRecords() {
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Combine all records
  const allRecords = Object.entries(mockMedicalRecords).flatMap(([patientId, records]) =>
    records.map((record) => ({
      ...record,
      patientName: mockPatients.find((p) => p.id === patientId)?.name || 'Unknown',
    }))
  );

  const filteredRecords = allRecords.filter((record) => {
    const matchesPatient = selectedPatient === 'all' || record.patientId === selectedPatient;
    const matchesSearch =
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    return matchesPatient && matchesSearch && matchesType;
  });

  // Sort by date (newest first)
  filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              Medical Records
            </h1>
            <p className="text-muted-foreground mt-1">
              Secure access to patient medical history
            </p>
          </div>
          <Button variant="medical">
            <Upload className="w-4 h-4 mr-2" />
            Upload Record
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {mockPatients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(recordTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Records timeline */}
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, i) => (
              <div
                key={record.id}
                className="bg-card rounded-xl border border-border p-5 shadow-soft hover:shadow-md transition-shadow animate-slide-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground truncate">{record.title}</h3>
                        <p className="text-sm text-muted-foreground">{record.patientName}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${recordTypeColors[record.type]}`}>
                        {recordTypeLabels[record.type]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        {record.hospital}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(record.date).toLocaleDateString()}
                      </span>
                    </div>

                    {record.notes && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {record.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 md:flex-col">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-xl border border-border p-12 text-center shadow-soft">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-display font-semibold text-foreground mb-2">No Records Found</h3>
              <p className="text-sm text-muted-foreground">
                No medical records match your current filters.
              </p>
            </div>
          )}
        </div>

        {/* Access log note */}
        <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            All record access is logged for compliance and security purposes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
