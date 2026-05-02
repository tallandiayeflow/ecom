import { useEffect, useRef } from 'react';

// Barcode scanners emulate keyboard: rapid keydown sequence ending with Enter.
// This hook collects chars arriving within 50ms into a buffer, fires callback on Enter.
export function useBarcode(onScan: (code: string) => void) {
  const buffer = useRef('');
  const lastKey = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const gap = now - lastKey.current;
      lastKey.current = now;

      if (e.key === 'Enter') {
        if (buffer.current.length >= 4) {
          onScan(buffer.current);
        }
        buffer.current = '';
        return;
      }

      if (gap > 100) {
        // Too slow for a scanner — this is normal typing
        buffer.current = '';
      }

      if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);
}
