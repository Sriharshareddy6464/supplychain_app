import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS } from '@/constants';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = ORDER_STATUS_LABELS[status] || { 
    label: status, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100' 
  };

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        config.bgColor, 
        config.color,
        "font-medium px-2.5 py-1",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
