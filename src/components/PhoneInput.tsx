import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import 'flag-icons/css/flag-icons.min.css';

export const COUNTRIES = [
  { code: '+221', name: 'Sénégal',        iso: 'sn' },
  { code: '+223', name: 'Mali',            iso: 'ml' },
  { code: '+225', name: "Côte d'Ivoire",   iso: 'ci' },
  { code: '+224', name: 'Guinée',          iso: 'gn' },
  { code: '+222', name: 'Mauritanie',      iso: 'mr' },
  { code: '+226', name: 'Burkina Faso',    iso: 'bf' },
  { code: '+227', name: 'Niger',           iso: 'ne' },
  { code: '+229', name: 'Bénin',           iso: 'bj' },
  { code: '+228', name: 'Togo',            iso: 'tg' },
  { code: '+233', name: 'Ghana',           iso: 'gh' },
  { code: '+234', name: 'Nigeria',         iso: 'ng' },
  { code: '+245', name: 'Guinée-Bissau',   iso: 'gw' },
  { code: '+238', name: 'Cap-Vert',        iso: 'cv' },
  { code: '+220', name: 'Gambie',          iso: 'gm' },
  { code: '+232', name: 'Sierra Leone',    iso: 'sl' },
  { code: '+231', name: 'Liberia',         iso: 'lr' },
  { code: '+237', name: 'Cameroun',        iso: 'cm' },
  { code: '+241', name: 'Gabon',           iso: 'ga' },
  { code: '+242', name: 'Congo',           iso: 'cg' },
  { code: '+243', name: 'RD Congo',        iso: 'cd' },
  { code: '+236', name: 'Centrafrique',    iso: 'cf' },
  { code: '+235', name: 'Tchad',           iso: 'td' },
  { code: '+212', name: 'Maroc',           iso: 'ma' },
  { code: '+213', name: 'Algérie',         iso: 'dz' },
  { code: '+216', name: 'Tunisie',         iso: 'tn' },
  { code: '+218', name: 'Libye',           iso: 'ly' },
  { code: '+20',  name: 'Égypte',          iso: 'eg' },
  { code: '+254', name: 'Kenya',           iso: 'ke' },
  { code: '+251', name: 'Éthiopie',        iso: 'et' },
  { code: '+255', name: 'Tanzanie',        iso: 'tz' },
  { code: '+256', name: 'Ouganda',         iso: 'ug' },
  { code: '+250', name: 'Rwanda',          iso: 'rw' },
  { code: '+27',  name: 'Afrique du Sud',  iso: 'za' },
  { code: '+244', name: 'Angola',          iso: 'ao' },
  { code: '+261', name: 'Madagascar',      iso: 'mg' },
  { code: '+230', name: 'Maurice',         iso: 'mu' },
  { code: '+33',  name: 'France',          iso: 'fr' },
  { code: '+32',  name: 'Belgique',        iso: 'be' },
  { code: '+41',  name: 'Suisse',          iso: 'ch' },
  { code: '+34',  name: 'Espagne',         iso: 'es' },
  { code: '+351', name: 'Portugal',        iso: 'pt' },
  { code: '+39',  name: 'Italie',          iso: 'it' },
  { code: '+49',  name: 'Allemagne',       iso: 'de' },
  { code: '+44',  name: 'Royaume-Uni',     iso: 'gb' },
  { code: '+1',   name: 'USA / Canada',    iso: 'us' },
  { code: '+55',  name: 'Brésil',          iso: 'br' },
  { code: '+966', name: 'Arabie Saoudite', iso: 'sa' },
  { code: '+971', name: 'Émirats arabes',  iso: 'ae' },
  { code: '+974', name: 'Qatar',           iso: 'qa' },
  { code: '+91',  name: 'Inde',            iso: 'in' },
  { code: '+86',  name: 'Chine',           iso: 'cn' },
];

const Flag = ({ iso, className = '' }: { iso: string; className?: string }) => (
  <span className={`fi fi-${iso} rounded-sm ${className}`} style={{ fontSize: '1.25rem', lineHeight: 1 }} />
);

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (phone: string) => void;
  onCountryChange: (code: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const PhoneInput = ({
  value,
  countryCode,
  onChange,
  onCountryChange,
  disabled = false,
  placeholder = '77 123 45 67',
  className = '',
}: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : COUNTRIES;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Unified input container */}
      <div
        className={`flex items-center h-12 border rounded-xl bg-white dark:bg-gray-900 transition-all
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          ${disabled ? 'opacity-50 pointer-events-none' : 'border-gray-200 dark:border-gray-700'}`}
      >
        {/* Country button — flag only */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          className="flex items-center gap-1.5 h-full pl-3 pr-2.5 border-r border-gray-200 dark:border-gray-700
            hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-xl transition shrink-0 select-none"
        >
          <Flag iso={selected.iso} />
          <ChevronDown
            className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Number input */}
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d\s]/g, ''))}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-full px-3 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays..."
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">Aucun résultat</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code + c.name}
                  type="button"
                  onClick={() => {
                    onCountryChange(c.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition text-left
                    ${c.code === countryCode
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <Flag iso={c.iso} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs font-mono text-gray-400 tabular-nums shrink-0">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
