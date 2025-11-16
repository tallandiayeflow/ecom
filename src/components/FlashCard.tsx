import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { FlashSale, Product } from '@/types';
import { Clock, Eye, ShoppingCart, Star, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FlashCardProps {
  flashSale?: FlashSale;
  showQuickView?: boolean;
}

export const FlashCard = ({ flashSale, showQuickView = true }: FlashCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Skeleton pendant le chargement
  if (!flashSale) {
    return (
      <Card className="opacity-30 animate-pulse pointer-events-none">
        <CardContent className="p-0">
          <div className="h-64 w-full bg-gray-300 rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-1/2 bg-gray-300 rounded" />
            <div className="h-4 w-3/4 bg-gray-300 rounded" />
            <div className="h-6 w-1/3 bg-gray-300 rounded" />
          </div>
        </CardContent>
        <CardFooter className="p-4 flex gap-2">
          <div className="h-10 w-full bg-gray-300 rounded" />
          <div className="h-10 w-full bg-gray-300 rounded" />
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
  const discountPercentage = flashSale.discountPercentage || 0;

  // Calcul du temps restant
  const getTimeRemaining = () => {
    if (!flashSale.endDate) return '';
    
    const now = new Date();
    const endDate = new Date(flashSale.endDate);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminée';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}j restant${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!product.inStock) {
      toast.error("Ce produit est en rupture de stock");
      return;
    }

    try {
      // Créer un produit avec le prix de la vente flash
      const flashProduct: Product = {
        ...product,
        price: discountPrice,
        originalPrice: originalPrice
      };
      
      await addToCart(flashProduct, 1);
      toast.success(`${product.name} ajouté au panier ! 🛒`);
    } catch {
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleViewProduct = () => {
    navigate(`/flash/${flashSale.id}`);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 border-orange-200 hover:border-orange-400"
      onClick={handleViewProduct}
    >
      <CardContent className="p-0 relative flex-1">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
          <Badge variant="destructive" className="font-bold bg-gradient-to-r from-red-500 to-orange-500">
            <Zap className="h-3 w-3 mr-1 fill-current" />
            -{discountPercentage}%
          </Badge>

          {!product.inStock && (
            <Badge variant="secondary">
              Rupture de stock
            </Badge>
          )}

          {product.featured && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              <Star className="h-3 w-3 mr-1" /> Vedette
            </Badge>
          )}
        </div>

        {/* Compteur temps restant */}
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-black/70 text-white">
            <Clock className="h-3 w-3 mr-1" />
            {getTimeRemaining()}
          </Badge>
        </div>

        {/* Image */}
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-orange-50 to-red-50">
          <img
            src={product.images[0] || product.image_url || "/placeholder-product.png"}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />

          {showQuickView && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  handleViewProduct();
                }}
              >
                <Eye className="h-4 w-4 mr-2" /> Voir détails
              </Button>
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="p-4 space-y-2">
          {(product.category || product.brand) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {product.category && <span className="font-medium">{product.category}</span>}
              {product.category && product.brand && <span>•</span>}
              {product.brand && <span>{product.brand}</span>}
            </div>
          )}

          <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-2 pt-2">
            <span className="text-2xl font-bold text-red-600">
              {discountPrice.toFixed(2)} Fcfa
            </span>
            <span className="text-sm text-muted-foreground line-through">
              {originalPrice.toFixed(2)} Fcfa
            </span>
          </div>

          <p className="text-xs text-green-600 font-semibold">
            Économisez {(originalPrice - discountPrice).toFixed(2)} Fcfa !
          </p>

          {/* Stock warning */}
          {product.inStock && product.stockQuantity <= 5 && (
            <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Plus que {product.stockQuantity} en stock !
            </p>
          )}
        </div>
      </CardContent>

      {/* Footer avec boutons */}
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="outline"
          className="flex-1 border-orange-400 text-orange-600 hover:bg-orange-50"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProduct();
          }}
        >
          <Eye className="h-4 w-4 mr-2" /> Voir
        </Button>

        <Button
          className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </CardFooter>
    </Card>
  );
};
