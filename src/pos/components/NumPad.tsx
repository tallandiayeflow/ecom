import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const KEYS = ['1','2','3','4','5','6','7','8','9','000','0','⌫'];

export function NumPad({ value, onChange, maxLength = 10 }: Props) {
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
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map(key => (
        <Button
          key={key}
          variant="outline"
          className="h-14 text-lg font-semibold"
          onClick={() => handleKey(key)}
        >
          {key === '⌫' ? <Delete className="w-5 h-5" /> : key}
        </Button>
      ))}
    </div>
  );
}
