import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getProducts } from '@/lib/api';
import type { Product } from '@/types';
import { Search, TrendingUp, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  onClose?: () => void;
  className?: string;
}

export const SearchBar = ({ onClose, className = '' }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Popular searches
  const popularSearches = ['iPhone', 'Samsung', 'AirPods', 'iPad', 'Watch'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { products } = await getProducts({
          search: searchQuery,
          limit: 5,
        });
        setSuggestions(products);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchQuery('');
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSuggestionClick = (product: Product) => {
    navigate(`/product/${product.id}`);
    setSearchQuery('');
    setIsOpen(false);
    onClose?.();
  };

  const handlePopularSearchClick = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && (searchQuery || suggestions.length > 0 || !searchQuery) && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-lg animate-fade-in">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Recherche en cours...
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Suggestions
              </div>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                >
                  <img
                    src={product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-sm text-primary font-semibold">
                      {product.price.toFixed(2)} Fcfa
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && searchQuery.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun résultat trouvé pour "{searchQuery}"
            </div>
          )}

          {/* Popular Searches */}
          {!searchQuery && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Recherches populaires
              </div>
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handlePopularSearchClick(term)}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-accent transition-colors text-left"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{term}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
