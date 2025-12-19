import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { getProduct } from '@/lib/api';
import { Product } from '@/types';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Heart,
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
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  useEffect(() => {
    // Reset image loading when product changes
    setImageLoading(true);
  }, [selectedImage]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const data = await getProduct(productId);
      setProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Produit introuvable');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      toast.success(`${quantity} x ${product.name} ajouté au panier ! 🛒`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Erreur lors de l'ajout au panier");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: url,
        });
        toast.success('Lien partagé !');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          toast.success('Lien copié !');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier !');
    }
  };

  const handleAddToWishlist = () => {
    toast.info('Fonctionnalité en cours de développement 💝');
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="w-24 h-10 rounded-lg mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Skeleton Images */}
          <div className="space-y-4">
            <Skeleton className="w-full h-[500px] rounded-xl" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Skeleton Infos */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="w-2/3 h-6" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-20" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="w-40 h-10" />
              <Skeleton className="w-32 h-6" />
            </div>
            <Separator />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-16" />
            <Skeleton className="w-full h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {/* Header avec boutons d'action */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleAddToWishlist}>
            <Heart className="h-4 w-4 text-red-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Images */}
        <div className="space-y-4">
          {/* Image principale */}
          <div className="relative h-[500px] rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-2">
            {imageLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
              src={product.images[selectedImage] || '/placeholder-product.png'}
              alt={product.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.png';
                setImageLoading(false);
              }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {discount > 0 && (
                <Badge variant="destructive" className="font-bold shadow-lg">
                  <Zap className="h-3 w-3 mr-1" />
                  -{discount}%
                </Badge>
              )}
              {!product.inStock && (
                <Badge variant="secondary" className="shadow-lg">
                  <Package className="h-3 w-3 mr-1" />
                  Rupture
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
                  <Star className="h-3 w-3 mr-1 fill-white" />
                  Vedette
                </Badge>
              )}
            </div>
          </div>

          {/* Miniatures */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedImage === index
                      ? 'border-primary scale-105 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section Informations */}
        <div className="space-y-6">
          {/* En-tête */}
          <div>
            {(product.category || product.brand) && (
              <div className="flex items-center gap-2 mb-3">
                {product.category && (
                  <Badge variant="outline" className="text-xs">
                    {product.category}
                  </Badge>
                )}
                {product.brand && (
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold text-primary border-primary"
                  >
                    {product.brand}
                  </Badge>
                )}
              </div>
            )}

            <h1 className="text-3xl font-bold mb-3 leading-tight">{product.name}</h1>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <Separator />

          {/* Prix */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
              {product.originalPrice && product.originalPrice !== product.price && (
                <span className="text-xl text-muted-foreground line-through">
                  {product.originalPrice.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>
            {discount > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  Économisez{' '}
                  {(product.originalPrice! - product.price).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Disponibilité */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-600">En stock</span>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="font-medium text-red-600">Rupture de stock</span>
                </>
              )}
            </div>

            {product.inStock && (
              <p className="text-sm text-muted-foreground ml-10">
                {product.stockQuantity} article(s) disponible(s)
              </p>
            )}

            {product.inStock && product.stockQuantity <= 5 && (
              <div className="ml-10 inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-md border border-orange-500/20">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">
                  Plus que {product.stockQuantity} restant(s) !
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Sélecteur de quantité */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Quantité:</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 px-4"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !product.inStock}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 px-4"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stockQuantity, q + 1))
                  }
                  disabled={quantity >= product.stockQuantity || !product.inStock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Maximum: <strong>{product.stockQuantity}</strong>
              </span>
            </div>
          </div>

          {/* Bouton Ajouter au panier */}
          <Button
            size="lg"
            className="w-full h-14 text-lg group"
            onClick={handleAddToCart}
            disabled={!product.inStock || addingToCart}
          >
            {addingToCart ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Ajouter au panier
              </>
            )}
          </Button>

          {/* Informations de livraison */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-1">Livraison gratuite</p>
                <p className="text-sm text-blue-700">
                  Pour les commandes supérieures à 25 000 FCFA
                </p>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Caractéristiques */}
          {product.specifications && Object.entries(product.specifications).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Caractéristiques techniques</h2>
              <Card className="p-4">
                <div className="space-y-3">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">{key}</span>
                      <span className="font-medium text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Section Description détaillée */}
      {product.description && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Description détaillée</h2>
          <Card className="p-6">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default ProductDetail;
