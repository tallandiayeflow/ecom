import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { createOrder, requestPaytechPayment, validateVoucher } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Gift,
  Info,
  Loader2,
  Package,
  Shield,
  Tag,
  Truck,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Checkout = () => {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });

  const deliveryThreshold = 25000;
  const shippingCost = cartTotal >= deliveryThreshold ? 0 : 2500;
  const finalTotal = cartTotal - discount + shippingCost;
  const loyaltyPointsToEarn = user ? Math.floor(finalTotal / 5000) : 0;

  // Vérifier panier vide
  useEffect(() => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      navigate('/cart');
    }
  }, [cart.length, navigate]);

  // Remplir formulaire avec données utilisateur
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
      });
    }
  }, [user]);

  if (cart.length === 0) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Veuillez entrer un code promo');
      return;
    }

    setValidatingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, cartTotal);
      if (result.valid) {
        setDiscount(result.discount);
        setVoucherApplied(true);
        toast.success(`Code promo appliqué ! -${result.discount.toLocaleString('fr-FR')} FCFA`);
      } else {
        toast.error(result.message || 'Code promo invalide');
        setDiscount(0);
        setVoucherApplied(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la validation du code');
      setDiscount(0);
      setVoucherApplied(false);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setDiscount(0);
    setVoucherApplied(false);
    toast.info('Code promo retiré');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.phone || !formData.address || !formData.city) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (formData.phone.length < 9) {
      toast.error('Numéro de téléphone invalide avec l\'indicatif"(minimum 9 chiffres)');
      return;
    }

    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setLoading(true);

    try {
      const orderData: any = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name,
        })),
        shippingAddress: { ...formData },
        voucherCode: voucherApplied ? voucherCode.toUpperCase() : undefined,
        discount,
        total: cartTotal,
        finalTotal,
        payment_method: paymentMethod,
        user_id: user?.id,
      };

      if (paymentMethod === 'cod') {
        const order = await createOrder(orderData);
        toast.success('Commande créée avec succès ! 🎉');
        await clearCart();
        navigate('/order-success', {
          state: {
            orderId: order.id,
            total: finalTotal,
            loyaltyPoints: order.loyaltyPointsEarned || 0,
          },
        });
      } else {
        const response = await requestPaytechPayment(orderData);

        if (response.success === 1 && response.redirect_url) {
          window.location.href = response.redirect_url;
        } else {
          toast.error(
            'Erreur lors de la préparation du paiement : ' + (response.message || '')
          );
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la commande');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Finaliser la commande</h1>
          <p className="text-muted-foreground">
            Plus qu'une étape avant de recevoir vos produits
          </p>
        </motion.div>

        {/* Alert pour utilisateurs non connectés */}
        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
              <Gift className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-900 flex items-center gap-2">
                <strong>Profitez de nos avantages !</strong>
                <Link
                  to="/auth"
                  className="underline font-semibold hover:text-blue-700 flex items-center gap-1"
                >
                  Connectez-vous
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                </Link>
                pour gagner des points de fidélité et suivre vos commandes
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire et paiement */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informations de livraison */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations de livraison
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">
                        Nom complet <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Jean Dupont"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">
                        Téléphone (avec l'indicatif) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Ex: +221 77 123 45 67"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">
                        Ville <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Ex: Dakar"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address">
                        Adresse complète <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Ex: Rue 10, Quartier Almadies"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code promo */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Code promo
                  </h2>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Entrez votre code promo"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      disabled={voucherApplied || validatingVoucher}
                      className="flex-1"
                    />
                    {!voucherApplied ? (
                      <Button
                        type="button"
                        onClick={handleApplyVoucher}
                        disabled={validatingVoucher || !voucherCode.trim()}
                        variant="outline"
                      >
                        {validatingVoucher ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Vérification...
                          </>
                        ) : (
                          'Appliquer'
                        )}
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" onClick={handleRemoveVoucher}>
                        Retirer
                      </Button>
                    )}
                  </div>

                  {voucherApplied && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-700 font-semibold">
                        Code appliqué : -{discount.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Méthode de paiement */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Méthode de paiement
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Paiement en ligne */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === 'online'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-white" />
                        </div>
                        <div
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'online'
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'online' && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-lg mb-1">Payer en ligne</div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Wave, Orange Money, Free Money
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Paiement sécurisé
                      </Badge>
                    </button>

                    {/* Paiement à la livraison */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <Banknote className="h-6 w-6 text-white" />
                        </div>
                        <div
                          className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'cod'
                              ? 'border-primary bg-primary'
                              : 'border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'cod' && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="font-semibold text-lg mb-1">
                        Paiement à la livraison
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        Espèces ou mobile money
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        À réception
                      </Badge>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Résumé de la commande */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-xl border-2">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Résumé
                  </h2>

                  <Separator />

                  {/* Articles */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        <img
                          src={
                            item.product.images?.[0] ||
                            item.product.image_url ||
                            '/placeholder-product.png'
                          }
                          alt={item.product.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {item.product.price.toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-sm font-semibold">
                            {(item.product.price * item.quantity).toLocaleString('fr-FR')} FCFA
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Calculs */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})
                      </span>
                      <span className="font-semibold">
                        {cartTotal.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 font-medium">Réduction</span>
                        <span className="font-bold text-green-600">
                          -{discount.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Livraison</span>
                      <span
                        className={`font-semibold ${
                          shippingCost === 0 ? 'text-green-600' : ''
                        }`}
                      >
                        {shippingCost === 0
                          ? 'Gratuite'
                          : `${shippingCost.toLocaleString('fr-FR')} FCFA`}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-primary text-2xl">
                      {finalTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  {/* Points de fidélité */}
                  {user && loyaltyPointsToEarn > 0 && (
                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-semibold text-orange-900">
                            Points de fidélité
                          </p>
                          <p className="text-xs text-orange-700">
                            Vous gagnerez {loyaltyPointsToEarn} points
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Livraison gratuite info */}
                  {cartTotal < deliveryThreshold && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">
                          Plus que{' '}
                          {(deliveryThreshold - cartTotal).toLocaleString('fr-FR')} FCFA pour
                          la livraison gratuite
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Boutons d'action */}
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 text-base shadow-lg"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Traitement en cours...
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5 mr-2" />
                          Valider la commande
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/cart')}
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour au panier
                    </Button>
                  </div>

                  {/* Trust badges */}
                  <div className="pt-4 space-y-2 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Paiement 100% sécurisé</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span>Livraison rapide et soignée</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
