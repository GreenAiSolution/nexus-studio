import * as React from 'react';
import { cn } from '@/lib/cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  trend?: { value: number; direction: 'up' | 'down' };
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ icon, label, value, unit, description, trend, className, ...props }, ref) => (
    <Card ref={ref} hover className={className} {...props}>
      <CardHeader className="mb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-text-secondary">{label}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">{value}</span>
          {unit && <span className="text-sm text-text-secondary">{unit}</span>}
        </div>
        {trend && (
          <div
            className={cn(
              'mt-3 text-xs font-medium',
              trend.direction === 'up' ? 'text-success' : 'text-error'
            )}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
);
StatCard.displayName = 'StatCard';

export { StatCard };
