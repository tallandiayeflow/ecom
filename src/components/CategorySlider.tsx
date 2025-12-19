import { Button } from '@/components/ui/button';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';
import {
  Battery,
  Bluetooth,
  Cable,
  Camera,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  Laptop,
  Loader2,
  MemoryStick,
  Monitor,
  Package,
  ShoppingBag,
  Smartphone,
  Speaker,
  Tablet,
  UsbIcon,
  Watch,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mapping des icônes par mot-clé de catégorie
const ICON_MAP: Record<string, LucideIcon> = {
  // Téléphones & Smartphones
  smartphone: Smartphone,
  téléphone: Smartphone,
  telephone: Smartphone,
  phone: Smartphone,
  mobile: Smartphone,
  iphone: Smartphone,
  samsung: Smartphone,
  android: Smartphone,

  // Ordinateurs & Laptops
  laptop: Laptop,
  ordinateur: Laptop,
  computer: Laptop,
  pc: Monitor,
  desktop: Monitor,
  moniteur: Monitor,

  // Audio & Son
  headphone: Headphones,
  écouteur: Headphones,
  ecouteur: Headphones,
  casque: Headphones,
  audio: Speaker,
  speaker: Speaker,
  enceinte: Speaker,
  son: Speaker,

  // Montres & Wearables
  watch: Watch,
  montre: Watch,
  smartwatch: Watch,

  // Photo & Caméras
  camera: Camera,
  caméra: Camera,
  appareil: Camera,
  photo: Camera,
  vidéo: Camera,
  video: Camera,

  // Gaming & Consoles
  gaming: Gamepad2,
  game: Gamepad2,
  jeu: Gamepad2,
  console: Gamepad2,
  playstation: Gamepad2,
  xbox: Gamepad2,
  nintendo: Gamepad2,

  // Tablettes
  tablet: Tablet,
  tablette: Tablet,
  ipad: Tablet,

  // Accessoires & Câbles
  accessoire: Package,
  accessory: Package,
  câble: Cable,
  cable: Cable,
  chargeur: Battery,
  charger: Battery,
  batterie: Battery,
  battery: Battery,
  usb: UsbIcon,

  // Stockage & Mémoire
  storage: HardDrive,
  stockage: HardDrive,
  disque: HardDrive,
  disk: HardDrive,
  ssd: HardDrive,
  hdd: HardDrive,
  mémoire: MemoryStick,
  memory: MemoryStick,
  ram: MemoryStick,

  // Connectivité
  wifi: Wifi,
  bluetooth: Bluetooth,
  sans: Wifi,
  wireless: Wifi,

  // Composants & Hardware
  composant: Cpu,
  component: Cpu,
  processeur: Cpu,
  processor: Cpu,
  cpu: Cpu,
  carte: Cpu,
  hardware: Cpu,

  // Électricité & Énergie
  électrique: Zap,
  electric: Zap,
  énergie: Zap,
  energy: Zap,
  power: Zap,
};

// Fonction pour obtenir l'icône d'une catégorie
const getCategoryIcon = (category: Category): LucideIcon => {
  const searchText = `${category.name} ${category.slug || ''}`.toLowerCase();

  // Recherche par correspondance dans le texte
  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (searchText.includes(keyword)) {
      return icon;
    }
  }

  // Icône par défaut
  return ShoppingBag;
};

// Type pour catégorie avec icône
interface CategoryWithIcon extends Category {
  Icon: LucideIcon;
}

export const CategorySlider = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    checkScrollButtons();
    const container = document.getElementById('category-slider');
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkScrollButtons = () => {
    const container = document.getElementById('category-slider');
    if (container) {
      setShowLeftButton(container.scrollLeft > 0);
      setShowRightButton(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('category-slider');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mémoriser les catégories avec leurs icônes
  const categoriesWithIcons = useMemo<CategoryWithIcon[]>(() => {
    return categories.map((category) => ({
      ...category,
      Icon: getCategoryIcon(category),
    }));
  }, [categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="relative group">
      {/* Bouton Gauche */}
      {showLeftButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Container Slider */}
      <div
        id="category-slider"
        className="flex gap-4 overflow-x-auto scroll-smooth py-2 px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {categoriesWithIcons.map((category) => {
          const { Icon } = category;

          return (
            <div
              key={category.id}
              onClick={() => navigate(`/products?category=${category.slug}`)}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-3 p-5 rounded-xl border bg-card hover:bg-accent/10 hover:shadow-lg hover:border-primary/50 transition-all duration-300 min-w-[140px] max-w-[180px] cursor-pointer text-center group/item"
            >
              {/* Icône de la catégorie */}
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover/item:from-primary/20 group-hover/item:to-primary/10 group-hover/item:scale-110 transition-all duration-300">
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </div>

              {/* Nom catégorie */}
              <h3 className="text-sm font-semibold line-clamp-2 group-hover/item:text-primary transition-colors">
                {category.name}
              </h3>

              {/* Nombre de produits */}
              {category.productCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {category.productCount}{' '}
                  {category.productCount === 1 ? 'produit' : 'produits'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bouton Droit */}
      {showRightButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
