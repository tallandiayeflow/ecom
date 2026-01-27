import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Cart = () => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } =
    useCart();
  const navigate = useNavigate();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const deliveryThreshold = 25000;
  const isEligibleForFreeDelivery = cartTotal >= deliveryThreshold;
  const remainingForFreeDelivery = Math.max(0, deliveryThreshold - cartTotal);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calcul des économies si originalPrice existe
  const totalSavings = cart.reduce((sum, item) => {
    if (
      item.product.originalPrice &&
      item.product.originalPrice > item.product.price
    ) {
      return (
        sum + (item.product.originalPrice - item.product.price) * item.quantity
      );
    }
    return sum;
  }, 0);

  const handleRemoveItem = async (
    productId: string,
    productName: string,
    selectedColor?: string,
    selectedSize?: string,
  ) => {
    setRemovingItems((prev) => new Set(prev).add(`${productId}-${selectedColor ?? 'no-color'}-${selectedSize ?? 'no-size'}`));
    try {
      await removeFromCart(productId, selectedColor, selectedSize);

      toast.success(`${productName} retiré du panier`);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearCart = () => {
    if (window.confirm("Voulez-vous vraiment vider votre panier ?")) {
      clearCart();
      toast.success("Panier vidé avec succès");
    }
  };

  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number,
    selectedColor?: string,
    selectedSize?: string,
  ) => {
    try {
      await updateQuantity(productId, newQuantity, selectedColor, selectedSize);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="h-32 w-32 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Votre panier est vide</h2>
            <p className="text-muted-foreground">
              Découvrez nos produits et commencez vos achats dès maintenant
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/products")}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Découvrir nos produits
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/flash")}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ventes Flash
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Mon Panier</h1>
              <p className="text-muted-foreground">
                {totalItems} article{totalItems > 1 ? "s" : ""} dans votre
                panier
              </p>
            </div>
            {cart.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearCart}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Vider le panier
              </Button>
            )}
          </div>
        </motion.div>

        {/* Free Delivery Banner */}
        {!isEligibleForFreeDelivery && remainingForFreeDelivery > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">
                      Plus que{" "}
                      {remainingForFreeDelivery.toLocaleString("fr-FR")} FCFA
                      pour la livraison gratuite !
                    </p>
                    <p className="text-sm text-blue-700">
                      Ajoutez encore quelques articles pour en profiter
                    </p>
                  </div>
                </div>
                <div className="mt-3 bg-blue-200/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{
                      width: `${Math.min((cartTotal / deliveryThreshold) * 100, 100)}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => {
              const isRemoving = removingItems.has(item.productId);
              const hasOriginalPrice =
                item.product.originalPrice &&
                item.product.originalPrice > item.product.price;
              const itemSavings = hasOriginalPrice
                ? (item.product.originalPrice! - item.product.price) *
                  item.quantity
                : 0;
              const discountPercentage = hasOriginalPrice
                ? Math.round(
                    ((item.product.originalPrice! - item.product.price) /
                      item.product.originalPrice!) *
                      100,
                  )
                : 0;

              return (
                <motion.div
                  key={`${item.productId}-${item.selectedColor ?? 'no-color'}-${item.selectedSize ?? 'no-size'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`hover:shadow-lg transition-shadow ${
                      isRemoving ? "opacity-50" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Image */}
                        <div
                          className="relative h-32 w-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted cursor-pointer group"
                          onClick={() => navigate(`/product/${item.productId}`)}
                        >
                          <img
                            src={
                              item.product.images?.[0] ||
                              item.product.image_url ||
                              "/placeholder-product.png"
                            }
                            alt={item.product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-product.png";
                            }}
                          />
                          {hasOriginalPrice && (
                            <Badge
                              variant="destructive"
                              className="absolute top-2 left-2 font-bold"
                            >
                              -{discountPercentage}%
                            </Badge>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-lg mb-1 hover:text-primary cursor-pointer line-clamp-2"
                            onClick={() =>
                              navigate(`/product/${item.productId}`)
                            }
                          >
                            {item.product.name}
                          </h3>
                          {item.product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {item.product.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {item.product.brand && (
                              <Badge variant="outline" className="text-xs">
                                {item.product.brand}
                              </Badge>
                            )}
                            {item.product.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.product.category}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-primary">
                              {item.product.price.toLocaleString("fr-FR")} FCFA
                            </span>
                            {hasOriginalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                {item.product.originalPrice!.toLocaleString(
                                  "fr-FR",
                                )}{" "}
                                FCFA
                              </span>
                            )}
                          </div>

                          <div  className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                            {(item.selectedColor || item.selectedSize) && (
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {item.selectedColor && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Couleur: {item.selectedColor}
                                  </Badge>
                                )}
                                {item.selectedSize && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Taille: {item.selectedSize}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {itemSavings > 0 && (
                            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Économie: {itemSavings.toLocaleString(
                                "fr-FR",
                              )}{" "}
                              FCFA
                            </p>
                          )}

                          {/* Stock Warning */}
                          {item.product.stockQuantity <= 5 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>
                                Plus que {item.product.stockQuantity} en stock
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-between gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveItem(item.productId, item.product.name, item.selectedColor, item.selectedSize)
                            }
                            disabled={isRemoving}
                            className="hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>

                          <div className="flex items-center gap-2 border-2 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateQuantity(item.productId, item.quantity - 1, item.selectedColor, item.selectedSize)
                              }
                              disabled={item.quantity <= 1 || isRemoving}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleUpdateQuantity(item.productId, item.quantity + 1, item.selectedColor, item.selectedSize)
                              }
                              disabled={
                                item.quantity >= item.product.stockQuantity ||
                                isRemoving
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Total
                            </p>
                            <p className="text-lg font-bold">
                              {(
                                item.product.price * item.quantity
                              ).toLocaleString("fr-FR")}{" "}
                              FCFA
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl border-2">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Résumé
                </h2>
                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Sous-total ({totalItems} article
                      {totalItems > 1 ? "s" : ""})
                    </span>
                    <span className="font-semibold">
                      {cartTotal.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">
                        Économies
                      </span>
                      <span className="font-bold text-green-600">
                        -{totalSavings.toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span
                      className={`font-semibold ${
                        isEligibleForFreeDelivery ? "text-green-600" : ""
                      }`}
                    >
                      {isEligibleForFreeDelivery ? "Gratuite" : "À calculer"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-primary text-3xl">
                      {cartTotal.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  {totalSavings > 0 && (
                    <p className="text-xs text-green-600 text-right">
                      Vous économisez {totalSavings.toLocaleString("fr-FR")}{" "}
                      FCFA
                    </p>
                  )}
                </div>

                <Button
                  size="lg"
                  className="w-full h-12 text-base shadow-lg group"
                  onClick={() => navigate("/checkout")}
                >
                  Passer la commande
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/products")}
                >
                  Continuer mes achats
                </Button>

                {/* Trust Badges */}
                <div className="pt-4 space-y-2 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>Livraison rapide et sécurisée</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span>Retours gratuits sous 30 jours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
