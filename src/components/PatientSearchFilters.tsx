import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface PatientSearchFiltersProps {
  onFiltersChange: (filters: PatientFilters) => void;
}

export interface PatientFilters {
  searchQuery: string;
  bloodGroup: string;
  riskLevel: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PatientSearchFilters({ onFiltersChange }: PatientSearchFiltersProps) {
  const [filters, setFilters] = useState<PatientFilters>({
    searchQuery: '',
    bloodGroup: 'all',
    riskLevel: 'all',
  });

  const updateFilter = (key: keyof PatientFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchQuery: '',
      bloodGroup: 'all',
      riskLevel: 'all',
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.bloodGroup !== 'all' || filters.riskLevel !== 'all' || filters.searchQuery !== '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or patient ID..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Blood Group filter */}
        <Select value={filters.bloodGroup} onValueChange={(value) => updateFilter('bloodGroup', value)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Blood Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blood Groups</SelectItem>
            {BLOOD_GROUPS.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Risk Level filter */}
        <Select value={filters.riskLevel} onValueChange={(value) => updateFilter('riskLevel', value)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filters active</span>
          {filters.bloodGroup !== 'all' && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              {filters.bloodGroup}
            </span>
          )}
          {filters.riskLevel !== 'all' && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs capitalize">
              {filters.riskLevel} Risk
            </span>
          )}
        </div>
      )}
    </div>
  );
}
