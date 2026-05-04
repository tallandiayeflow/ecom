import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  quickAmounts?: number[];
}

const KEYS = ['1','2','3','4','5','6','7','8','9','000','0','⌫'];

export function NumPad({ value, onChange, maxLength = 10, quickAmounts }: Props) {
  const handleKey = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1) || '0');
    } else {
      if (value === '0') {
        onChange(key === '000' ? '0' : key);
      } else if (value.length < maxLength) {
        onChange(value + key);
      }
    }
  };

  return (
    <div className="space-y-2">
      {quickAmounts && quickAmounts.length > 0 && (
        <div className="grid grid-cols-5 gap-1.5">
          {quickAmounts.map(amt => (
            <Button
              key={amt}
              variant="outline"
              className="h-9 text-xs font-semibold px-1 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onChange(String(amt))}
            >
              {amt >= 1000 ? `${amt / 1000}k` : amt}
            </Button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map(key => (
          <Button
            key={key}
            variant={key === '⌫' ? 'outline' : 'outline'}
            className={`h-12 text-lg font-semibold transition-all active:scale-95 ${key === '⌫' ? 'text-muted-foreground' : ''}`}
            onClick={() => handleKey(key)}
          >
            {key === '⌫' ? <Delete className="w-5 h-5" /> : key}
          </Button>
        ))}
      </div>
    </div>
  );
}
