import { Badge } from '@/components/ui/badge';
import {
  STATUS_COLORS,
  JADWAL_STATUS_COLORS,
  PRESENSI_STATUS,
} from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  type?: 'anggota' | 'jadwal' | 'lokasi' | 'presensi';
}

export function StatusBadge({ status, type = 'anggota' }: StatusBadgeProps) {
  const getClassName = (): string => {
    switch (type) {
      case 'anggota':
        return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
      case 'jadwal':
        return (
          JADWAL_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
        );
      case 'presensi':
        return (
          PRESENSI_STATUS[status]?.color || 'bg-gray-100 text-gray-800'
        );
      case 'lokasi':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVariant = (): 'success' | 'warning' | 'info' | 'destructive' | 'muted' | 'purple' | 'default' => {
    const className = getClassName();
    if (className.includes('green')) return 'success';
    if (className.includes('yellow')) return 'warning';
    if (className.includes('blue')) return 'info';
    if (className.includes('red')) return 'destructive';
    if (className.includes('purple')) return 'purple';
    if (className.includes('orange')) return 'warning';
    if (className.includes('gray')) return 'muted';
    return 'default';
  };

  const displayLabel = (): string => {
    if (type === 'presensi') {
      return PRESENSI_STATUS[status]?.label || status.replace(/_/g, ' ');
    }
    return status.replace(/_/g, ' ');
  };

  return (
    <Badge variant={getVariant()} className={getClassName()}>
      {displayLabel()}
    </Badge>
  );
}
