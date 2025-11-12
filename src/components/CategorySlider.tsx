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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

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
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Container des catégories - ✅ Style inline pour masquer la scrollbar */}
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
          <button
            key={category.id}
            onClick={() => navigate(`/products?category=${category.slug}`)}
            className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent hover:shadow-md transition-all duration-200 min-w-[120px] group/item"
          >
            {/* Icône */}
            <div className="text-4xl transition-transform group-hover/item:scale-110">
              {category.icon || '📱'}
            </div>
            
            {/* Nom de la catégorie */}
            <span className="text-sm font-medium text-center line-clamp-2">
              {category.name}
            </span>
            
            {/* Nombre de produits */}
            {category.productCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {category.productCount} {category.productCount === 1 ? 'produit' : 'produits'}
              </span>
            )}
          </button>
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
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
