import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Cart = () => {
  const { cart, cartTotal, cartCount, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const navigate = useNavigate();
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  // Gérer la mise à jour de quantité
  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setProcessingItems(prev => new Set(prev).add(productId));
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Gérer la suppression d'un article
  const handleRemove = async (productId: string, productName: string) => {
    setProcessingItems(prev => new Set(prev).add(productId));
    try {
      await removeFromCart(productId);
      toast.success(`${productName} retiré du panier`);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  // Gérer le vidage du panier
  const handleClearCart = async () => {
    if (!window.confirm('Voulez-vous vraiment vider le panier ?')) return;

    try {
      await clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Panier vide
  if (cart.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Votre panier est vide</h2>
              <p className="text-muted-foreground">
                Ajoutez des produits pour commencer vos achats
              </p>
            </div>
            <Button onClick={() => navigate('/products')} size="lg">
              Découvrir nos produits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // État de chargement
  if (loading && cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mon Panier</h1>
          <p className="text-muted-foreground mt-1">
            {cartCount} article{cartCount > 1 ? 's' : ''} dans votre panier
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Continuer mes achats
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des articles */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bouton vider le panier */}
          {cart.length > 0 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCart}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Vider le panier
              </Button>
            </div>
          )}

          {/* Articles du panier */}
          {cart.map((item) => {
            const isProcessing = processingItems.has(item.productId);
            
            return (
              <Card key={item.productId} className={isProcessing ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image du produit */}
                    <div 
                      className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/products/${item.productId}`)}
                    >
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Informations du produit */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-primary line-clamp-2"
                            onClick={() => navigate(`/products/${item.productId}`)}
                          >
                            {item.product.name}
                          </h3>
                          {item.product.brand && (
                            <Badge variant="outline" className="mt-1">
                              {item.product.brand}
                            </Badge>
                          )}
                          {item.product.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.product.description}
                            </p>
                          )}
                        </div>

                        {/* Bouton supprimer */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.productId, item.product.name)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        {/* Sélecteur de quantité */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isProcessing}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQuantity || isProcessing}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          {/* Indicateur de stock */}
                          {item.product.stockQuantity <= 5 && (
                            <span className="text-xs text-orange-600 ml-2">
                              Plus que {item.product.stockQuantity} en stock
                            </span>
                          )}
                        </div>

                        {/* Prix */}
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            {(item.product.price * item.quantity).toFixed(2)} DH
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.product.price.toFixed(2)} DH × {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Résumé de la commande */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Détails */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total ({cartCount} articles)</span>
                  <span className="font-medium">{cartTotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-medium text-green-600">
                    {cartTotal >= 500 ? 'Gratuite' : `${(50).toFixed(2)} DH`}
                  </span>
                </div>
                {cartTotal < 500 && (
                  <p className="text-xs text-muted-foreground">
                    Plus que {(500 - cartTotal).toFixed(2)} DH pour la livraison gratuite
                  </p>
                )}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  {(cartTotal + (cartTotal >= 500 ? 0 : 50)).toFixed(2)} DH
                </span>
              </div>

              {/* Bouton Commander */}
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate('/checkout')}
                disabled={loading || cart.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  <>
                    Passer la commande
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Informations supplémentaires */}
              <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Paiement sécurisé
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Livraison sous 2-5 jours ouvrés
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Retour gratuit sous 14 jours
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
