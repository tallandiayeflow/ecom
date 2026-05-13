import { FlashCard } from '@/components/FlashCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { getCategories, getFlashSales } from '@/lib/api';
import { Category, FlashSale } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Zap,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FlashSales = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('discount-desc');

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadFlashSales(); }, [currentPage, selectedCategory, priceRange, inStockOnly, searchParams]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadFlashSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getFlashSales({
        search: searchParams.get('search') || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 500000 ? priceRange[1] : undefined,
        inStock: inStockOnly || undefined,
        page: currentPage,
        limit: 12,
      });
      setFlashSales(response.flashSales);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error loading flash sales:', err);
      setError('Erreur lors du chargement des ventes flash');
      setFlashSales([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedFlashSales = useMemo(() => {
    const sorted = [...flashSales];
    switch (sortBy) {
      case 'discount-desc': return sorted.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
      case 'price-asc': return sorted.sort((a, b) => a.discountPrice - b.discountPrice);
      case 'price-desc': return sorted.sort((a, b) => b.discountPrice - a.discountPrice);
      case 'ending-soon': return sorted.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
      default: return sorted;
    }
  }, [flashSales, sortBy]);

  const handleSearch = () => {
    if (searchQuery.trim()) setSearchParams({ search: searchQuery.trim() });
    else setSearchParams({});
    setCurrentPage(1);
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 500000]);
    setInStockOnly(false);
    setSortBy('discount-desc');
    setSearchParams({});
    setCurrentPage(1);
  };

  const activeFilterCount = [
    selectedCategory !== 'all',
    priceRange[0] > 0 || priceRange[1] < 500000,
    inStockOnly,
    !!searchQuery,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 block">
          Catégorie
        </Label>
        <div className="space-y-0.5">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            Toutes les catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center justify-between group ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <span>{cat.name}</span>
              {(cat.productCount ?? 0) > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 ${
                  selectedCategory === cat.slug
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground group-hover:bg-background'
                }`}>
                  {cat.productCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t" />

      {/* Price */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground block">
          Prix (FCFA)
        </Label>
        <div className="flex gap-2 text-sm">
          <div className="flex-1 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-center font-medium">
            {priceRange[0].toLocaleString()}
          </div>
          <span className="self-center text-muted-foreground">–</span>
          <div className="flex-1 rounded-lg border bg-muted/30 px-2.5 py-1.5 text-center font-medium">
            {priceRange[1].toLocaleString()}
          </div>
        </div>
        <Slider
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          min={0}
          max={500000}
          step={1000}
          className="w-full"
        />
      </div>

      <div className="border-t" />

      {/* Stock */}
      <div className="flex items-center justify-between">
        <Label htmlFor="in-stock" className="text-sm cursor-pointer font-medium">
          En stock uniquement
        </Label>
        <Switch id="in-stock" checked={inStockOnly} onCheckedChange={setInStockOnly} />
      </div>

      <div className="border-t" />

      {hasActiveFilters && (
        <Button onClick={resetFilters} variant="outline" className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="mb-8 text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-400/20 mb-1">
          <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />
          <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Offres limitées</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Ventes Flash
        </h1>
        <AnimatePresence mode="wait">
          {total > 0 && (
            <motion.p
              key={total}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground"
            >
              {total} offre{total > 1 ? 's' : ''} flash disponible{total > 1 ? 's' : ''}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category quick bar */}
      <div className="hidden md:flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => handleCategoryChange('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'border-border hover:bg-muted'
          }`}
        >
          Tout
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              selectedCategory === cat.slug
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'border-border hover:bg-muted'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Search & sort bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une vente flash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-11"
          />
        </div>

        <Button onClick={handleSearch} className="md:w-auto h-11">
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[220px] h-11">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discount-desc">Meilleure réduction</SelectItem>
            <SelectItem value="ending-soon">Se termine bientôt</SelectItem>
            <SelectItem value="price-asc">Prix croissant</SelectItem>
            <SelectItem value="price-desc">Prix décroissant</SelectItem>
          </SelectContent>
        </Select>

        {/* Mobile filter */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden relative h-11 gap-2">
              <Filter className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[380px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </SheetTitle>
            </SheetHeader>
            <FilterContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filter tags */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 rounded-full">
                {categories.find(c => c.slug === selectedCategory)?.name}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 500000) && (
              <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 rounded-full">
                {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()} FCFA
                <button
                  onClick={() => setPriceRange([0, 500000])}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {inStockOnly && (
              <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 rounded-full">
                En stock
                <button
                  onClick={() => setInStockOnly(false)}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="gap-1.5 pl-3 pr-2 py-1.5 rounded-full">
                "{searchQuery}"
                <button
                  onClick={() => { setSearchQuery(''); setSearchParams({}); }}
                  className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Tout effacer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="flex gap-6">

        {/* Sidebar — desktop */}
        <div className="hidden md:block w-64 shrink-0">
          <Card className="sticky top-4 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Filtres</span>
              </div>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <FilterContent />
          </Card>
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {error && (
            <Card className="bg-destructive/10 border-destructive/20 p-4 mb-6">
              <p className="text-destructive font-medium">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedFlashSales.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Zap className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Aucune vente flash trouvée</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Revenez plus tard ou modifiez vos critères de recherche
                  </p>
                  <Button onClick={resetFilters} variant="outline" size="sm" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser les filtres
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {sortedFlashSales.map((flashSale, index) => (
                  <motion.div
                    key={flashSale.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.35, ease: EASE }}
                  >
                    <FlashCard flashSale={flashSale} index={index} />
                  </motion.div>
                ))}
              </motion.div>

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
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex gap-1">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          return (
                            <Button
                              key={i}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="icon"
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={loading}
                              className="w-9 h-9"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sortedFlashSales.length} affichées
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

export default FlashSales;
