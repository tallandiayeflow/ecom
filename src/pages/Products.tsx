import { ProductCard } from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { getCategories, getProducts } from '@/lib/api';
import { Category, Product } from '@/types';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3x3,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentPage, selectedCategory, priceRange, inStockOnly, searchParams]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProducts({
        search: searchParams.get('search') || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 500000 ? priceRange[1] : undefined,
        inStock: inStockOnly || undefined,
        page: currentPage,
        limit: 12,
      });

      setProducts(response.products || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Erreur lors du chargement des produits');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ TRI CÔTÉ CLIENT
  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadProducts();
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 500000]);
    setInStockOnly(false);
    setSortBy('newest');
    setSearchParams({});
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    priceRange[0] > 0 ||
    priceRange[1] < 500000 ||
    inStockOnly ||
    searchQuery;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Catégorie</Label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">
          Prix: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FCFA
        </Label>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          min={0}
          max={500000}
          step={1000}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 FCFA</span>
          <span>500 000 FCFA</span>
        </div>
      </div>

      {/* Stock Filter */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
        <Label htmlFor="in-stock" className="text-sm cursor-pointer">
          En stock uniquement
        </Label>
        <Switch id="in-stock" checked={inStockOnly} onCheckedChange={setInStockOnly} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 flex-wrap">
        <Button onClick={applyFilters} className="flex-1">
          <Filter className="h-4 w-4 mr-2" />
          Appliquer
        </Button>
        <Button onClick={resetFilters} variant="outline" className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center space-y-2"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Nos Produits
        </h1>
        {total > 0 && (
          <p className="text-muted-foreground">
            {total} produit{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      {/* Search and Sort Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-11"
          />
        </div>

        <Button onClick={handleSearch} className="md:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>

        {/* Sort Select */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Plus récents</SelectItem>
            <SelectItem value="price-asc">Prix croissant</SelectItem>
            <SelectItem value="price-desc">Prix décroissant</SelectItem>
            <SelectItem value="name">Nom A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Mobile Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
              {hasActiveFilters && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </SheetTitle>
              <SheetDescription>Affinez votre recherche de produits</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters Pills */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap gap-2">
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="gap-2">
              Catégorie: {categories.find((c) => c.slug === selectedCategory)?.name}
              <button onClick={() => handleCategoryChange('all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < 500000) && (
            <Badge variant="secondary" className="gap-2">
              Prix: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} FCFA
              <button onClick={() => setPriceRange([0, 500000])}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {inStockOnly && (
            <Badge variant="secondary" className="gap-2">
              En stock
              <button onClick={() => setInStockOnly(false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="gap-2">
              Recherche: "{searchQuery}"
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6">
            Tout effacer
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Filters Sidebar - Desktop */}
        <div className="hidden md:block w-72 shrink-0">
          <Card className="sticky top-4 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Filtres</h2>
            </div>
            <FilterContent />
          </Card>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {error && (
            <Card className="bg-destructive/10 border-destructive/20 p-4 mb-6">
              <p className="text-destructive font-medium">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Grid3x3 className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Aucun produit trouvé</h3>
                  <p className="text-muted-foreground mb-4">
                    Essayez de modifier vos critères de recherche
                  </p>
                  <Button onClick={resetFilters} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Card className="p-4 mt-8">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages}
                    </p>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex gap-1">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={i}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="icon"
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={loading}
                              className="w-10 h-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {sortedProducts.length} produits affichés
                    </p>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
