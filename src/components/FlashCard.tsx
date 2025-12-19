import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { FlashSale, Product } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Eye, Flame, ShoppingCart, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FlashCardProps {
  flashSale?: FlashSale;
  showQuickView?: boolean;
  index?: number;
}

export const FlashCard = ({
  flashSale,
  showQuickView = true,
  index = 0,
}: FlashCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calcul du temps restant
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

    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  // Mise à jour du temps restant toutes les minutes
  useEffect(() => {
    if (!flashSale?.endDate) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [flashSale?.endDate]);

  // Skeleton pendant le chargement
  if (!flashSale) {
    return (
      <Card className="h-full flex flex-col overflow-hidden border-2 border-orange-200">
        <CardContent className="p-0 flex-1">
          <Skeleton className="h-64 w-full rounded-t-lg" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-baseline gap-2 pt-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 flex gap-2 border-t">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </CardFooter>
      </Card>
    );
  }

  // Vérifier que product existe
  if (!flashSale.product) {
    return null;
  }

  const product = flashSale.product;
  const discountPrice = flashSale.discountPrice;
  const originalPrice = product.price;
  const discountPercentage = flashSale.discountPrice || flashSale.discountPercentage || 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!product.inStock) {
      toast.error('Ce produit est en rupture de stock');
      return;
    }

    if (isExpired) {
      toast.error('Cette vente flash est terminée');
      return;
    }

    try {
      // Créer un produit avec le prix de la vente flash
      const flashProduct: Product = {
        ...product,
        price: discountPrice,
        originalPrice: originalPrice,
      };

      await addToCart(flashProduct, 1);
      toast.success(`${product.name} ajouté au panier ! 🛒🔥`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleViewProduct = () => {
    navigate(`/product/${flashSale.productId}`);
  };

  const imageSrc = imageError
    ? '/placeholder-product.png'
    : product.images?.[0] || '/placeholder-product.png';

  // Déterminer l'urgence du temps restant
  const getUrgencyLevel = () => {
    if (isExpired) return 'expired';
    if (!flashSale.endDate) return 'normal';

    const now = new Date();
    const endDate = new Date(flashSale.endDate);
    const diff = endDate.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours <= 2) return 'critical'; // Moins de 2h
    if (hours <= 24) return 'urgent'; // Moins de 24h
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={`group cursor-pointer hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden border-2 ${
          isExpired
            ? 'border-gray-300 opacity-60'
            : 'border-orange-300 hover:border-orange-500 hover:scale-[1.02]'
        } relative`}
        onClick={handleViewProduct}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Barre "En direct" animée */}
        {!isExpired && (
          <div
            className={`absolute top-0 left-0 right-0 h-1 z-20 ${
              urgencyLevel === 'critical'
                ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 animate-pulse'
                : urgencyLevel === 'urgent'
                ? 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 animate-pulse'
                : 'bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500'
            }`}
          />
        )}

        <CardContent className="p-0 relative flex-1">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            <Badge
              variant="destructive"
              className={`font-bold shadow-lg ${
                urgencyLevel === 'critical'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 animate-bounce'
                  : 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
              }`}
            >
              <Flame className="h-3 w-3 mr-1 fill-white" />
              -{discountPercentage}%
            </Badge>

            {!product.inStock && (
              <Badge variant="secondary" className="shadow-lg">
                Rupture
              </Badge>
            )}

            {product.featured && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-lg">
                <Star className="h-3 w-3 mr-1 fill-white" /> Vedette
              </Badge>
            )}
          </div>

          {/* Compteur temps restant */}
          <div className="absolute top-3 right-3 z-10">
            <Badge
              className={`font-semibold shadow-lg ${
                isExpired
                  ? 'bg-gray-500'
                  : urgencyLevel === 'critical'
                  ? 'bg-red-600 animate-pulse'
                  : urgencyLevel === 'urgent'
                  ? 'bg-orange-600 animate-pulse'
                  : 'bg-gradient-to-r from-black/80 to-gray-900/80 backdrop-blur-sm'
              }`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {timeRemaining || getTimeRemaining()}
            </Badge>
          </div>

          {/* Image */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 h-64">
            {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
            <img
              src={imageSrc}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${
                isExpired ? 'grayscale' : ''
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />

            {/* Overlay Quick View */}
            {showQuickView && !isExpired && (
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Button
                  variant="secondary"
                  size="lg"
                  className="shadow-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProduct();
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> Voir détails
                </Button>
              </div>
            )}

            {/* Badge "Terminée" overlay */}
            {isExpired && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  Vente Flash Terminée
                </Badge>
              </div>
            )}
          </div>

          {/* Infos produit */}
          <div className="p-4 space-y-2 flex-1 flex flex-col">
            {/* Catégorie & Marque */}
            {(product.category || product.brand) && (
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {product.category && (
                  <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 font-medium">
                    {product.category}
                  </span>
                )}
                {product.brand && (
                  <span className="font-semibold text-orange-600">{product.brand}</span>
                )}
              </div>
            )}

            {/* Titre */}
            <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-orange-600 transition-colors">
              {product.name}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {product.description}
              </p>
            )}

            {/* Prix */}
            <div className="flex flex-col gap-1 pt-2 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  {discountPrice.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-md border border-green-500/20 w-fit">
                <Zap className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-semibold">
                  Économisez {(originalPrice - discountPrice).toLocaleString('fr-FR')}{' '}
                  FCFA
                </span>
              </div>
            </div>

            {/* Stock warning */}
            {product.inStock &&
              product.stockQuantity &&
              product.stockQuantity <= 5 &&
              !isExpired && (
                <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-md border border-orange-500/20 animate-pulse">
                  <Flame className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">
                    Plus que {product.stockQuantity} en stock !
                  </p>
                </div>
              )}
          </div>
        </CardContent>

        {/* Footer avec boutons */}
        <CardFooter className="p-4 pt-0 gap-2 border-t bg-gradient-to-r from-orange-50/50 to-red-50/50">
          <Button
            variant="outline"
            className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50 group/btn"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct();
            }}
          >
            <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            Voir
          </Button>

          <Button
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg group/btn disabled:from-gray-400 disabled:to-gray-500"
            onClick={handleAddToCart}
            disabled={!product.inStock || isExpired}
          >
            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            {isExpired ? 'Terminée' : product.inStock ? 'Ajouter' : 'Épuisé'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
