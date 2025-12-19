import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { getFlashSaleId } from '@/lib/api';
import { FlashSale, Product } from '@/types';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Flame,
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

const FlashDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadFlashSale(id);
    }
  }, [id]);

  // Timer pour le compte à rebours
  useEffect(() => {
    if (!flashSale?.endDate) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000); // Mise à jour chaque seconde

    return () => clearInterval(interval);
  }, [flashSale?.endDate]);

  useEffect(() => {
    setImageLoading(true);
  }, [selectedImage]);

  const loadFlashSale = async (flashSaleId: string) => {
    setLoading(true);
    try {
      const data = await getFlashSaleId(flashSaleId);

      if (data && data.product) {
        setFlashSale(data);
        setProduct(data.product);
      } else {
        throw new Error('Données de vente flash invalides');
      }
    } catch (error) {
      console.error('Error loading flash sale:', error);
      toast.error('Vente flash introuvable');
      navigate('/flash');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !flashSale) return;

    if (isExpired) {
      toast.error('Cette vente flash est terminée');
      return;
    }

    setAddingToCart(true);
    try {
      const flashProduct: Product = {
        ...product,
        price: flashSale.discountPrice,
        originalPrice: product.price,
      };

      await addToCart(flashProduct, quantity);
      toast.success(`${quantity} x ${product.name} ajouté au panier ! 🛒🔥`);
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
          title: `Vente Flash: ${product?.name}`,
          text: `Ne manquez pas cette offre flash !`,
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

  // Calculer le temps restant
  const getTimeRemaining = () => {
    if (!flashSale?.endDate) return '';

    const now = new Date();
    const endDate = new Date(flashSale.endDate);
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) {
      setIsExpired(true);
      return 'Terminée';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}j ${hours}h ${minutes}min`;
    if (hours > 0) return `${hours}h ${minutes}min ${seconds}s`;
    return `${minutes}min ${seconds}s`;
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="w-24 h-10 rounded-lg mb-6" />
        <Skeleton className="w-full h-32 rounded-xl mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="w-full h-[500px] rounded-xl" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="w-2/3 h-6" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-20" />
            </div>
            <Separator />
            <Skeleton className="w-full h-20" />
            <Separator />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !flashSale) {
    return null;
  }

  const remainingStock = flashSale.stock - (flashSale.soldCount || 0);
  const stockPercentage = (remainingStock / flashSale.stock) * 100;
  const soldPercentage = 100 - stockPercentage;
  const discountAmount = product.price - flashSale.discountPrice;
  const urgencyLevel = remainingStock <= 5 ? 'critical' : remainingStock <= 10 ? 'urgent' : 'normal';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {/* Header avec actions */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/flash')} size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux ventes flash
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

      {/* Banner Vente Flash */}
      <Card
        className={`p-6 mb-8 border-2 ${
          isExpired
            ? 'bg-gradient-to-r from-gray-400 to-gray-500'
            : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x'
        } text-white shadow-2xl`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Flame className="h-8 w-8 fill-current" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Vente Flash {isExpired && '(Terminée)'}
              </h2>
              <p className="text-sm opacity-90">
                Économisez {flashSale.discountPrice || flashSale.discountPercentage}% • {discountAmount.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          {!isExpired && (
            <div className="text-center md:text-right">
              <div className="flex items-center gap-2 text-lg mb-2">
                <Clock className="h-5 w-5" />
                <span className="font-bold tabular-nums">{timeRemaining}</span>
              </div>
              <p className="text-sm opacity-90">
                {remainingStock} / {flashSale.stock} restants
              </p>
            </div>
          )}
        </div>

        {/* Barre de progression du stock */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="opacity-90">Vendus: {flashSale.soldCount || 0}</span>
            <span className="opacity-90">{soldPercentage.toFixed(0)}% vendus</span>
          </div>
          <Progress value={soldPercentage} className="h-3 bg-white/20" />
        </div>

        {/* Alerte urgence */}
        {urgencyLevel === 'critical' && !isExpired && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">
              Stock critique ! Plus que {remainingStock} article(s) !
            </span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Images */}
        <div className="space-y-4">
          <div className="relative h-[500px] rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
            {imageLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
            <img
              src={
                product.images?.[selectedImage] ||
                product.image_url ||
                '/placeholder-product.png'
              }
              alt={product.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              } ${isExpired ? 'grayscale' : ''}`}
              onLoad={() => setImageLoading(false)}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.png';
                setImageLoading(false);
              }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge
                variant="destructive"
                className="font-bold bg-gradient-to-r from-red-600 to-orange-600 shadow-lg text-base px-3 py-1"
              >
                <Zap className="h-4 w-4 mr-1 fill-white" />
                -{flashSale.discountPrice || flashSale.discountPercentage}%
              </Badge>

              {!product.inStock && (
                <Badge variant="secondary" className="shadow-lg">
                  <Package className="h-3 w-3 mr-1" />
                  Rupture
                </Badge>
              )}

              {product.featured && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-lg">
                  <Star className="h-3 w-3 mr-1 fill-white" />
                  Vedette
                </Badge>
              )}
            </div>

            {isExpired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-xl px-6 py-3">
                  Vente Flash Terminée
                </Badge>
              </div>
            )}
          </div>

          {/* Miniatures */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedImage === index
                      ? 'border-orange-500 scale-105 shadow-lg'
                      : 'border-gray-200 hover:border-orange-300'
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
                    className="text-xs font-semibold text-orange-600 border-orange-600"
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
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                {flashSale.discountPrice.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-xl text-muted-foreground line-through">
                {product.price.toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm text-green-600 font-semibold">
                Économisez {discountAmount.toLocaleString('fr-FR')} FCFA (
                {flashSale.discountPrice || flashSale.discountPercentage}%)
              </span>
            </div>
          </div>

          <Separator />

          {/* Disponibilité */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {remainingStock > 0 ? (
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
                  <span className="font-medium text-red-600">Stock épuisé</span>
                </>
              )}
            </div>

            {remainingStock > 0 && (
              <p className="text-sm text-muted-foreground ml-10">
                {remainingStock} article(s) disponible(s) en vente flash
              </p>
            )}

            {urgencyLevel !== 'normal' && remainingStock > 0 && !isExpired && (
              <div className="ml-10 inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded-md border border-orange-500/20 animate-pulse">
                <Flame className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600 font-medium">
                  Plus que {remainingStock} restant(s) !
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
                  disabled={quantity <= 1 || remainingStock === 0 || isExpired}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center font-bold text-lg">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-12 px-4"
                  onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                  disabled={quantity >= remainingStock || remainingStock === 0 || isExpired}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Maximum: <strong>{remainingStock}</strong>
              </span>
            </div>
          </div>

          {/* Bouton Ajouter au panier */}
          <Button
            size="lg"
            className="w-full h-14 text-lg bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-xl group disabled:from-gray-400 disabled:to-gray-500"
            onClick={handleAddToCart}
            disabled={remainingStock === 0 || addingToCart || isExpired}
          >
            {addingToCart ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {isExpired
                  ? 'Vente terminée'
                  : remainingStock === 0
                  ? 'Stock épuisé'
                  : 'Ajouter au panier'}
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

export default FlashDetails;
