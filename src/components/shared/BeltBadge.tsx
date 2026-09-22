import { Badge } from '@/components/ui/badge';
import { SABUK_COLORS, SABUK_LABELS } from '@/lib/constants';

type SabukType = 'Putih' | 'Kuning' | 'Hijau' | 'Biru' | 'Coklat' | 'Hitam';

interface BeltBadgeProps {
  sabuk: SabukType;
}

const SABUK_BADGE_CLASSES: Record<SabukType, string> = {
  Putih:
    'bg-white text-gray-800 border-gray-300',
  Kuning:
    'bg-yellow-100 text-yellow-800 border-yellow-300',
  Hijau:
    'bg-green-100 text-green-800 border-green-300',
  Biru:
    'bg-blue-100 text-blue-800 border-blue-300',
  Coklat:
    'bg-amber-100 text-amber-800 border-amber-400',
  Hitam:
    'bg-gray-900 text-white border-gray-700',
};

export function BeltBadge({ sabuk }: BeltBadgeProps) {
  const colorHex = SABUK_COLORS[sabuk] || '#CCCCCC';
  const label = SABUK_LABELS[sabuk] || sabuk;
  const classes = SABUK_BADGE_CLASSES[sabuk] || 'bg-gray-100 text-gray-800';

  return (
    <Badge
      variant="outline"
      className={`${classes} gap-1.5 font-medium`}
    >
      <span
        className="inline-block h-3 w-3 rounded-full border border-gray-300"
        style={{ backgroundColor: colorHex }}
      />
      {label}
    </Badge>
  );
}
