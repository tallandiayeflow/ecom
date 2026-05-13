import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { getImageUrl } from '@/lib/api';
import { Product } from '@/types';
import { motion } from 'framer-motion';
import {
  Eye,
  Heart,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductCardProps {
  product?: Product;
  showQuickView?: boolean;
  index?: number;
}

// Fonction helper pour vérifier si un produit est nouveau (moins de 30 jours)
const isProductNew = (createdAt: string): boolean => {
  try {
    const productDate = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - productDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  } catch {
    return false;
  }
};

export const ProductCard = ({
  product,
  showQuickView = true,
  index = 0,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ---------- SKELETON LORS DU LOADING ----------
  if (!product) {
    return (
      <Card className="h-full flex flex-col overflow-hidden">
        <CardContent className="p-0 flex-1">
          <Skeleton className="h-64 w-full rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-baseline gap-2 pt-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-20" />
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

  // ---------- CALCUL DU POURCENTAGE DE REDUCTION ----------
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // ---------- GESTION D'IMAGE ----------
  const imageSrc = imageError
    ? '/placeholder-product.png'
    : getImageUrl(product.images?.[0] || '/placeholder-product.png');

  // ---------- AJOUT AU PANIER ----------
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!product.inStock) {
      toast.error('Ce produit est en rupture de stock');
      return;
    }

    try {
      await addToCart(
        product,
        1,
        product.colors?.[0],
        product.sizes?.[0]
      );
      toast.success(`${product.name} ajouté au panier ! 🛒`);
    } catch (error) {
      console.error('Erreur ajout panier:', error);
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleViewProduct = () => {
    navigate(`/product/${product.id}`);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info('Fonctionnalité en cours de développement 💝');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="h-full"
    >
      <Card
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden border-2 hover:border-primary/50"
        onClick={handleViewProduct}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0 relative flex-1">
          {/* Badges Empilés */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {discount > 0 && (
              <Badge
                variant="destructive"
                className="font-bold shadow-lg animate-in fade-in slide-in-from-left duration-300"
              >
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
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg">
                <Star className="h-3 w-3 mr-1 fill-white" />
                Vedette
              </Badge>
            )}

            {/* Badge Nouveau - basé sur la date de création */}
            {product.createdAt && isProductNew(product.createdAt) && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                <TrendingUp className="h-3 w-3 mr-1" />
                Nouveau
              </Badge>
            )}
          </div>

          {/* Bouton Wishlist */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110"
            onClick={handleAddToWishlist}
          >
            <Heart className="h-4 w-4 text-red-500" />
          </Button>

          {/* IMAGE */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-64">
            {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
            <img
              src={imageSrc}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-110' : 'scale-100'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />

            {/* Overlay avec bouton Quick View */}
            {showQuickView && (
              <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </Button>
              </div>
            )}
          </div>

          {/* INFOS */}
          <div className="p-4 space-y-2 flex-1 flex flex-col">
            {/* Catégorie & Marque */}
            {(product.category || product.brand) && (
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {product.category && (
                  <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
                    {product.category}
                  </span>
                )}
                {product.brand && (
                  <span className="font-semibold text-primary">{product.brand}</span>
                )}
              </div>
            )}

            {/* Subcategory pills */}
            {product.subcategories && product.subcategories.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {product.subcategories.slice(0, 2).map((sub) => (
                  <span
                    key={sub.id}
                    className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs"
                  >
                    {sub.name}
                  </span>
                ))}
                {product.subcategories.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{product.subcategories.length - 2} autres
                  </span>
                )}
              </div>
            )}

            {/* Titre */}
            <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {product.description}
              </p>
            )}

            {/* Prix */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {product.originalPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>

              {/* Note par étoiles - Pour usage futur */}
              {/* Décommentez quand vous aurez implémenté le système de notation
              {product.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
                </div>
              )}
              */}
            </div>

            {/* Alerte Stock Faible */}
            {product.inStock && product.stockQuantity && product.stockQuantity <= 5 && (
              <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-md border border-orange-500/20">
                <Zap className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <p className="text-xs text-orange-600 font-medium">
                  Plus que {product.stockQuantity} en stock !
                </p>
              </div>
            )}
          </div>
        </CardContent>

        {/* FOOTER */}
        <CardFooter className="p-4 pt-0 gap-2 border-t bg-muted/20">
          <Button
            variant="outline"
            className="flex-1 group/btn"
            onClick={(e) => {
              e.stopPropagation();
              handleViewProduct();
            }}
          >
            <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            Voir
          </Button>

          <Button
            className="flex-1 group/btn"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            {product.inStock ? 'Ajouter' : 'Épuisé'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
