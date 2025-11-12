import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { getProduct } from '@/lib/api';
import { Product } from '@/types';
import {
  ArrowLeft,
  Check,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Truck
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

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

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
      toast.error('Erreur lors de l\'ajout au panier');
    } finally {
      setAddingToCart(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Chargement du produit...</p>
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
        size="sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Images - TAILLE RÉDUITE */}
        <div className="space-y-3">
          {/* Image principale - Hauteur réduite à 400px au lieu de aspect-square */}
          <div className="relative h-[400px] rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.images[selectedImage] || '/placeholder-product.png'}
              alt={product.name}
              className="w-full h-full object-contain" // object-contain au lieu de object-cover
            />
            
            {/* Badges - Taille réduite */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discount > 0 && (
                <Badge variant="destructive" className="px-2 py-0.5 text-sm">
                  -{discount}%
                </Badge>
              )}
              {!product.inStock && (
                <Badge variant="secondary" className="px-2 py-0.5 text-sm">
                  Rupture
                </Badge>
              )}
              {product.featured && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600 px-2 py-0.5 text-sm">
                  <Star className="h-3 w-3 mr-1" />
                  Vedette
                </Badge>
              )}
            </div>
          </div>

          {/* Miniatures - Plus petites */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary scale-105'
                      : 'border-transparent hover:border-gray-300'
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

        {/* Section Informations - Plus compacte */}
        <div className="space-y-4">
          {/* En-tête */}
          <div>
            {(product.category || product.brand) && (
              <div className="flex items-center gap-2 text-xs mb-2">
                {product.category && (
                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                )}
                {product.brand && (
                  <Badge variant="outline" className="text-xs">{product.brand}</Badge>
                )}
              </div>
            )}

            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>

          <Separator />

          {/* Prix - Plus compact */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {product.price.toFixed(2)} DH
              </span>
              {product.originalPrice && product.originalPrice !== product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  {product.originalPrice.toFixed(2)} DH
                </span>
              )}
            </div>
            {discount > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Économisez {(product.originalPrice! - product.price).toFixed(2)} DH
              </p>
            )}
          </div>

          <Separator />

          {/* Disponibilité - Compact */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">En stock</span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Rupture de stock</span>
                </>
              )}
            </div>
            {product.inStock && (
              <p className="text-xs text-muted-foreground">
                {product.stockQuantity} article(s) disponible(s)
              </p>
            )}
            {product.inStock && product.stockQuantity <= 5 && (
              <p className="text-xs text-orange-600 font-medium">
                ⚠️ Plus que {product.stockQuantity} restant(s) !
              </p>
            )}
          </div>

          <Separator />

          {/* Sélecteur de quantité - Plus petit */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Quantité:</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || !product.inStock}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                  disabled={quantity >= product.stockQuantity || !product.inStock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Max: {product.stockQuantity}
              </span>
            </div>
          </div>

          {/* Bouton Ajouter au panier */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={!product.inStock || addingToCart}
          >
            {addingToCart ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ajouter au panier
              </>
            )}
          </Button>

          {/* Informations de livraison - Card plus petite */}
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Truck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Livraison gratuite</p>
                <p className="text-xs text-blue-700">
                  Commandes plus de 25000 FCFA
                </p>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Caractéristiques - Plus compact */}
          {Object.entries(product.specifications).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-lg font-bold">Caractéristiques</h2>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-1.5 border-b last:border-0 text-sm"
                  >
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Description - Plus petite */}
      {product.description && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Description</h2>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
