import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { Eye, ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductCardProps {
  product?: Product;   // Peut être undefined pendant chargement
  showQuickView?: boolean;
}

export const ProductCard = ({ product, showQuickView = true }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // ---------- SKELETON LORS DU LOADING ----------
  if (!product) {
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

  // ---------- CALCUL DU POURCENTAGE DE REDUCTION ----------
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // ---------- AJOUT AU PANIER ----------
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!product.inStock) {
      toast.error("Ce produit est en rupture de stock");
      return;
    }

    try {
      await addToCart(product, 1);
      toast.success(`${product.name} ajouté au panier !`);
    } catch (error) {
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleViewProduct = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col"
      onClick={handleViewProduct}
    >
      <CardContent className="p-0 relative flex-1">
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
          {discount > 0 && (
            <Badge variant="destructive" className="font-bold">
              -{discount}%
            </Badge>
          )}

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

        {/* IMAGE */}
        <div className="relative overflow-hidden rounded-t-lg bg-gray-100">
          <img
            src={product.images[0] || "/placeholder-product.png"}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {showQuickView && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProduct();
                }}
              >
                <Eye className="h-4 w-4 mr-2" /> Voir détails
              </Button>
            </div>
          )}
        </div>

        {/* INFOS */}
        <div className="p-4 space-y-2">
          {(product.category || product.brand) && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {product.category && <span>{product.category}</span>}
              {product.category && product.brand && <span>•</span>}
              {product.brand && <span>{product.brand}</span>}
            </div>
          )}

          <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-baseline gap-2 pt-2">
            <span className="text-2xl font-bold text-primary">
              {product.price.toFixed(2)} Fcfa
            </span>

            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {product.originalPrice.toFixed(2)} Fcfa
              </span>
            )}
          </div>

          {product.inStock && product.stockQuantity <= 5 && (
            <p className="text-xs text-orange-600 font-medium">
              Plus que {product.stockQuantity} en stock !
            </p>
          )}
        </div>
      </CardContent>

      {/* FOOTER */}
      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            handleViewProduct();
          }}
        >
          <Eye className="h-4 w-4 mr-2" /> Voir
        </Button>

        <Button
          className="flex-1"
          onClick={handleAddToCart}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" /> Ajouter
        </Button>
      </CardFooter>
    </Card>
  );
};
