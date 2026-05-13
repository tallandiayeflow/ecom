import { Button } from '@/components/ui/button';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Smartphone,
  Laptop,
  Headphones,
  Gamepad2,
  Camera,
  Watch,
  Tablet,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* Icônes simples par type */
const ICONS: Record<string, LucideIcon> = {
  phone: Smartphone,
  laptop: Laptop,
  audio: Headphones,
  game: Gamepad2,
  camera: Camera,
  watch: Watch,
  tablet: Tablet,
};

const getIcon = (name: string): LucideIcon => {
  const key = Object.keys(ICONS).find(k =>
    name.toLowerCase().includes(k)
  );
  return key ? ICONS[key] : ShoppingBag;
};

export const CategorySlider = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  /* Auto-scroll simple */
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const id = setInterval(() => {
      slider.scrollBy({ left: 220, behavior: 'smooth' });
      if (
        slider.scrollLeft + slider.clientWidth >=
        slider.scrollWidth - 10
      ) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }, 3000);

    return () => clearInterval(id);
  }, [categories]);

  const scroll = (x: number) =>
    sliderRef.current?.scrollBy({ left: x, behavior: 'smooth' });

  const items = useMemo(() => {
    const flat: (Category & { Icon: LucideIcon; parentSlug?: string })[] = [];
    for (const cat of categories) {
      flat.push({ ...cat, Icon: getIcon(cat.name) });
      if (cat.subcategories?.length) {
        for (const sub of cat.subcategories) {
          flat.push({ ...sub, Icon: getIcon(sub.name), parentSlug: cat.slug });
        }
      }
    }
    return flat;
  }, [categories]);

  if (!items.length) return null;

  return (
    <div className="relative">
      {/* Gauche */}
      <Button
        size="icon"
        variant="outline"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
        onClick={() => scroll(-300)}
      >
        <ChevronLeft />
      </Button>

      {/* Slider */}
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto scroll-smooth py-2 px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map(({ id, name, slug, productCount, Icon, parentSlug }) => (
          <div
            key={id}
            onClick={() =>
              parentSlug
                ? navigate(`/products?category=${parentSlug}&subcategory=${slug}`)
                : navigate(`/products?category=${slug}`)
            }
            className="min-w-[150px] cursor-pointer rounded-xl border bg-card p-5 text-center hover:shadow-md transition"
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-7 w-7 text-primary" />
            </div>

            <h3 className="text-sm font-semibold">{name}</h3>

            {productCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {productCount} produit{productCount > 1 && 's'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Droite */}
      <Button
        size="icon"
        variant="outline"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex"
        onClick={() => scroll(300)}
      >
        <ChevronRight />
      </Button>
    </div>
  );
};
