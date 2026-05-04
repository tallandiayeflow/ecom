import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl, getProduct, getProducts } from '@/lib/api';
import type { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  Home,
  Loader2,
  Minus,
  Package,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (id) loadProduct(id);
  }, [id]);

  useEffect(() => {
    setImageLoading(true);
  }, [selectedImage]);

  const discount = useMemo(() => {
    if (!product?.originalPrice || product.originalPrice === product.price) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }, [product]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const data = await getProduct(productId);
      setProduct(data);
      setSelectedImage(0);
      setQuantity(1);
      setSelectedColor(data?.colors?.[0] ?? null);
      setSelectedSize(data?.sizes?.[0] ?? null);

      if (data?.category) {
        setLoadingSimilar(true);
        try {
          const res = await getProducts({ category: data.category, limit: 10, page: 1 });
          setSimilarProducts(res.products.filter((p) => p.id !== data.id).slice(0, 8));
        } finally {
          setLoadingSimilar(false);
        }
      } else {
        setSimilarProducts([]);
      }
    } catch {
      toast.error('Produit introuvable');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (product.colors?.length && !selectedColor) { toast.error('Veuillez choisir une couleur'); return; }
    if (product.sizes?.length && !selectedSize) { toast.error('Veuillez choisir une taille'); return; }

    setAddingToCart(true);
    try {
      addToCart(product, quantity, selectedColor ?? undefined, selectedSize ?? undefined);
      const details = [
        selectedColor ? `Couleur: ${selectedColor}` : null,
        selectedSize ? `Taille: ${selectedSize}` : null,
      ].filter(Boolean).join(' · ');
      toast.success(`${quantity} × ${product.name}${details ? ` (${details})` : ''} ajouté au panier !`);
    } catch {
      toast.error("Erreur lors de l'ajout au panier");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, text: product?.description, url });
        toast.success('Lien partagé !');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast.success('Lien copié !');
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier !');
    }
  };

  const handleAddToWishlist = () => {
    toast.info('Fonctionnalité en cours de développement');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="w-64 h-5 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-2xl" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => <Skeleton key={n} className="w-20 h-20 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-5">
            <Skeleton className="w-1/3 h-5" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-40 h-10" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasSpecs = product.specifications && Object.entries(product.specifications).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-6 max-w-7xl pb-28 lg:pb-10"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 flex-wrap">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          Accueil
        </button>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <button
          onClick={() => navigate('/products')}
          className="hover:text-foreground transition-colors"
        >
          Produits
        </button>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <button
              onClick={() => navigate(`/products?category=${encodeURIComponent(product.category!)}`)}
              className="hover:text-foreground transition-colors truncate max-w-[120px]"
            >
              {product.category}
            </button>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Back + Actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleAddToWishlist} className="rounded-xl">
            <Heart className="h-4 w-4 text-rose-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare} className="rounded-xl">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── LEFT: Images + Description + Specs ── */}
        <div className="space-y-6">
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted border">
            {imageLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
            <img
              src={getImageUrl(product.images?.[selectedImage] || '/placeholder-product.png')}
              alt={product.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setImageLoading(false)}
              onError={(e) => { e.currentTarget.src = '/placeholder-product.png'; setImageLoading(false); }}
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount > 0 && (
                <Badge variant="destructive" className="shadow-lg font-bold">
                  <Zap className="h-3 w-3 mr-1" />-{discount}%
                </Badge>
              )}
              {!product.inStock && (
                <Badge variant="secondary" className="shadow-lg">
                  <Package className="h-3 w-3 mr-1" />Rupture
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                  <Star className="h-3 w-3 mr-1 fill-white" />Vedette
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary shadow-md scale-105'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="text-lg font-bold mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Specs */}
          {hasSpecs && (
            <div>
              <h2 className="text-lg font-bold mb-3">Caractéristiques</h2>
              <div className="rounded-xl border overflow-hidden">
                {Object.entries(product.specifications!).map(([key, value], i) => (
                  <div
                    key={key}
                    className={`flex justify-between items-center px-4 py-3 text-sm gap-4 ${
                      i % 2 === 0 ? 'bg-muted/40' : 'bg-background'
                    }`}
                  >
                    <span className="text-muted-foreground shrink-0">{key}</span>
                    <span className="font-medium text-right">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Info + Purchase ── */}
        <div className="space-y-5">
          {/* Category + Brand */}
          {(product.category || product.brand) && (
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(product.category!)}`)}
                >
                  {product.category}
                </Badge>
              )}
              {product.brand && (
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/40">
                  {product.brand}
                </Badge>
              )}
            </div>
          )}

          <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl font-bold text-primary tabular-nums">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
              {product.originalPrice && product.originalPrice !== product.price && (
                <span className="text-xl text-muted-foreground line-through tabular-nums">
                  {product.originalPrice.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>
            {discount > 0 && product.originalPrice && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                <Zap className="h-3.5 w-3.5 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                  Économisez {(product.originalPrice - product.price).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-3 flex-wrap">
            {product.inStock ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium text-green-700 dark:text-green-400">En stock</span>
                {product.stockQuantity > 0 && (
                  <span className="text-sm text-muted-foreground">
                    · {product.stockQuantity} disponible(s)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-red-600" />
                </div>
                <span className="font-medium text-red-600">Rupture de stock</span>
              </div>
            )}
            {product.inStock && product.stockQuantity <= 5 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 rounded-lg border border-orange-500/20 text-xs font-medium text-orange-700 dark:text-orange-400">
                <Zap className="h-3 w-3" />Plus que {product.stockQuantity} !
              </span>
            )}
          </div>

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold">Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={selectedColor === c ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedColor(c)}
                    disabled={!product.inStock}
                    className="rounded-lg"
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <Label className="font-semibold">Taille</Label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={selectedSize === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(s)}
                    disabled={!product.inStock}
                    className="rounded-lg"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="font-semibold">Quantité</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border-2 overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-4 rounded-none"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !product.inStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-14 text-center font-bold text-lg tabular-nums">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-4 rounded-none"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity || !product.inStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">max {product.stockQuantity}</span>
            </div>
          </div>

          {/* Add to cart — desktop only (mobile uses sticky bar) */}
          <div className="hidden lg:block pt-1">
            <Button
              size="lg"
              className="w-full h-14 text-base font-bold group rounded-xl gap-2"
              onClick={handleAddToCart}
              disabled={!product.inStock || addingToCart}
            >
              {addingToCart ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Ajout en cours...</>
              ) : (
                <><ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />Ajouter au panier</>
              )}
            </Button>
          </div>

          {/* Shipping info */}
          <Card className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">Livraison gratuite</p>
                <p className="text-xs text-muted-foreground">Pour les commandes supérieures à 25 000 FCFA</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-1">Découvrez aussi</p>
              <h2 className="text-2xl font-bold">Produits similaires</h2>
            </div>
            {loadingSimilar && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {similarProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-50 bg-background/95 backdrop-blur-md border-t px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Prix</p>
          <p className="text-xl font-bold text-primary tabular-nums truncate">
            {product.price.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
        <Button
          size="lg"
          className="shrink-0 h-12 font-bold rounded-xl gap-2 px-6"
          onClick={handleAddToCart}
          disabled={!product.inStock || addingToCart}
        >
          {addingToCart
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <><ShoppingCart className="h-5 w-5" />Ajouter</>
          }
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductDetail;
