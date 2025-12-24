import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, showIcon = true, size = 'md' }: RiskBadgeProps) {
  const config = {
    low: {
      label: 'Low Risk',
      className: 'bg-risk-low/10 text-risk-low border-risk-low/20',
      icon: CheckCircle,
    },
    medium: {
      label: 'Medium Risk',
      className: 'bg-risk-medium/10 text-risk-medium border-risk-medium/20',
      icon: AlertCircle,
    },
    high: {
      label: 'High Risk',
      className: 'bg-risk-high/10 text-risk-high border-risk-high/20',
      icon: AlertTriangle,
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const { label, className, icon: Icon } = config[level];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        className,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </span>
  );
}
