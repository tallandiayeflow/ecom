import { Button } from '@/components/ui/button';
import { getCategories } from '@/lib/api';
import { Category } from '@/types';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      setShowRightButton(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('category-slider');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => navigate(`/products?category=${category.slug}`)}
            className="flex-shrink-0 flex flex-col items-center justify-center p-5 rounded-xl border bg-card hover:bg-accent/10 hover:shadow-lg transition-all duration-300 min-w-[140px] max-w-[180px] cursor-pointer text-center"
          >
            {/* Nom catégorie uniquement */}
            <h3 className="text-sm font-semibold line-clamp-2">
              {category.name}
            </h3>

            {/* Nombre de produits */}
            {category.productCount > 0 && (
              <span className="text-xs text-muted-foreground mt-1">
                {category.productCount} {category.productCount === 1 ? 'produit' : 'produits'}
              </span>
            )}

            
          </div>
        ))}
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
