import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { getFlashSaleId } from '@/lib/api';
import { FlashSale, Product } from '@/types';
import {
    ArrowLeft,
    Check,
    Clock,
    Loader2,
    Minus,
    Package,
    Plus,
    ShoppingCart,
    Star,
    Truck,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

const FlashsDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      loadFlashSale(id);
    }
  }, [id]);

  const loadFlashSale = async (flashSaleId: string) => {
    setLoading(true);
    try {
      const data = await getFlashSaleId(flashSaleId);
      
      // Vérifier si data est un objet FlashSale
      if (data && data.product) {
        setFlashSale(data);
        setProduct(data.product);
      } else {
        throw new Error('Données de vente flash invalides');
      }
    } catch (error) {
      console.error('Error loading flash sale:', error);
      toast.error('Vente flash introuvable');
      navigate('/flash-sales');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !flashSale) return;

    setAddingToCart(true);
    try {
      // Créer un produit avec le prix de la vente flash
      const flashProduct: Product = {
        ...product,
        price: flashSale.discountPrice,
        originalPrice: product.price
      };
      
      await addToCart(flashProduct, quantity);
      toast.success(`${quantity} x ${product.name} ajouté au panier ! 🛒`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Erreur lors de l\'ajout au panier');
    } finally {
      setAddingToCart(false);
    }
  };

  // Calculer le temps restant
  const getTimeRemaining = () => {
    if (!flashSale) return '';
    
    const now = new Date();
    const endDate = new Date(flashSale.endDate);
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Terminée';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}j ${hours}h restantes`;
    if (hours > 0) return `${hours}h ${minutes}min restantes`;
    return `${minutes}min restantes`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl opacity-40 animate-pulse pointer-events-none select-none">
        <div className="w-24 h-8 bg-gray-200 rounded mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="h-[400px] bg-gray-200 rounded-lg" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="w-16 h-16 bg-gray-200 rounded-md" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div className="w-40 h-5 bg-gray-200 rounded" />
              <div className="w-64 h-6 bg-gray-300 rounded" />
              <div className="w-full h-4 bg-gray-200 rounded" />
            </div>
            <div className="w-full h-[1px] bg-gray-200" />
            <div className="space-y-2">
              <div className="w-32 h-8 bg-gray-300 rounded" />
              <div className="w-24 h-4 bg-gray-200 rounded" />
            </div>
            <div className="w-full h-[1px] bg-gray-200" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-gray-200 rounded" />
              <div className="w-28 h-4 bg-gray-200 rounded" />
            </div>
            <div className="w-full h-[1px] bg-gray-200" />
            <div className="space-y-2">
              <div className="w-32 h-5 bg-gray-200 rounded" />
              <div className="w-40 h-10 bg-gray-300 rounded-lg" />
            </div>
            <div className="w-full h-12 bg-gray-300 rounded-lg" />
            <div className="w-full h-16 bg-gray-200 rounded-lg" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="w-40 h-6 bg-gray-300 rounded" />
          <div className="w-full h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product || !flashSale) {
    return null;
  }

  const remainingStock = flashSale.stock - (flashSale.soldCount || 0);
  const stockPercentage = (remainingStock / flashSale.stock) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={() => navigate('/flash-sales')}
        className="mb-4"
        size="sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux ventes flash
      </Button>

      {/* Badge Vente Flash */}
      <Card className="p-4 mb-6 bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 fill-current" />
            <div>
              <h2 className="text-xl font-bold">Vente Flash</h2>
              <p className="text-sm opacity-90">
                Économisez {flashSale.discountPercentage}% sur ce produit !
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{getTimeRemaining()}</span>
            </div>
            <p className="text-xs opacity-90 mt-1">
              {remainingStock} / {flashSale.stock} restants
            </p>
          </div>
        </div>
        
        {/* Barre de progression du stock */}
        <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-300"
            style={{ width: `${stockPercentage}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Images */}
        <div className="space-y-3">
          <div className="relative h-[400px] rounded-lg overflow-hidden bg-gray-100">
            <img
              src={product.images[selectedImage] || product.image_url || '/placeholder-product.png'}
              alt={product.name}
              className="w-full h-full object-contain"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <Badge variant="destructive" className="px-2 py-0.5 text-sm">
                <Zap className="h-3 w-3 mr-1" />
                -{flashSale.discountPercentage}%
              </Badge>
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

          {/* Miniatures */}
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

        {/* Section Informations */}
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

          {/* Prix */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-red-600">
                {flashSale.discountPrice.toFixed(2)} Fcfa
              </span>
              <span className="text-lg text-muted-foreground line-through">
                {product.price.toFixed(2)} Fcfa
              </span>
            </div>
            <p className="text-xs text-green-600 font-medium">
              Économisez {(product.price - flashSale.discountPrice).toFixed(2)} Fcfa ({flashSale.discountPercentage}%)
            </p>
          </div>

          <Separator />

          {/* Disponibilité */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {remainingStock > 0 ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">En stock</span>
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">Stock épuisé</span>
                </>
              )}
            </div>
            {remainingStock > 0 && (
              <>
                <p className="text-xs text-muted-foreground">
                  {remainingStock} article(s) disponible(s) en vente flash
                </p>
                {remainingStock <= 5 && (
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Plus que {remainingStock} restant(s) !
                  </p>
                )}
              </>
            )}
          </div>

          <Separator />

          {/* Sélecteur de quantité */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Quantité:</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || remainingStock === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-12 text-center font-semibold text-sm">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity((q) => Math.min(remainingStock, q + 1))}
                  disabled={quantity >= remainingStock || remainingStock === 0}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Max: {remainingStock}
              </span>
            </div>
          </div>

          {/* Bouton Ajouter au panier */}
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            onClick={handleAddToCart}
            disabled={remainingStock === 0 || addingToCart}
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

          {/* Informations de livraison */}
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

          {/* Caractéristiques */}
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

      {/* Section Description */}
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

export default FlashsDetails;
