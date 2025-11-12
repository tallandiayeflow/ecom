import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { CreateOrderData } from '@/lib/api';
import { createOrder, validateVoucher } from '@/lib/api';
import { ArrowLeft, CheckCircle, Gift, Loader2, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Checkout = () => {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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

  // ✅ Calculer les totaux AVANT de les utiliser
  const shippingCost = cartTotal >= 500 ? 0 : 50;
  const finalTotal = cartTotal - discount + shippingCost;
  const loyaltyPointsToEarn = Math.floor(finalTotal / 10);

  useEffect(() => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      navigate('/cart');
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (!user) {
      toast.error('Veuillez vous connecter pour passer commande');
      navigate('/auth?redirect=/checkout');
    }
  }, [user, navigate]);

  if (cart.length === 0 || !user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        toast.success(result.message || 'Code promo appliqué !');
      } else {
        toast.error(result.message || 'Code promo invalide');
        setDiscount(0);
        setVoucherApplied(false);
      }
    } catch (error: any) {
      console.error('Error validating voucher:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la validation du code';
      toast.error(errorMessage);
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

    // Validation des champs
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim() || !formData.city.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.phone.length < 10) {
      toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setLoading(true);
    try {
      // Préparer les données de la commande
      const orderData: CreateOrderData = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name,
        })),
        shippingAddress: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
        },
        voucherCode: voucherApplied ? voucherCode : undefined,
        discount: discount,
      };

      // Créer la commande
      const order = await createOrder(orderData);
      
      // Vider le panier
      await clearCart();

      // Toast de succès
      toast.success('Commande créée avec succès ! 🎉');

      // ✅ REDIRECTION vers la page de succès avec les données
      navigate('/order-success', {
        state: {
          orderId: order.id,
          total: finalTotal,
          loyaltyPoints: loyaltyPointsToEarn,
          order: order, // Passer l'objet complet
        },
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création de la commande';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Finaliser la commande</h1>
        <Button variant="ghost" onClick={() => navigate('/cart')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au panier
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de livraison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+212 6XX XXX XXX"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse complète *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Rue, numéro, appartement..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Casablanca"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Code promo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    placeholder="Entrez votre code"
                    disabled={voucherApplied || validatingVoucher}
                    className="flex-1"
                  />
                  {!voucherApplied ? (
                    <Button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={!voucherCode.trim() || validatingVoucher}
                      variant="outline"
                    >
                      {validatingVoucher ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Vérification...</>
                      ) : (
                        'Appliquer'
                      )}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleRemoveVoucher} variant="outline">
                      Retirer
                    </Button>
                  )}
                </div>
                {voucherApplied && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Code appliqué : -{discount.toFixed(2)} DH</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex gap-3 text-sm">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2">{item.product.name}</p>
                        <p className="text-muted-foreground">{item.quantity} × {item.product.price.toFixed(2)} DH</p>
                      </div>
                      <div className="font-semibold">{(item.product.price * item.quantity).toFixed(2)} DH</div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total ({cartCount} articles)</span>
                    <span className="font-medium">{cartTotal.toFixed(2)} DH</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction</span>
                      <span className="font-medium">-{discount.toFixed(2)} DH</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                      {shippingCost === 0 ? 'Gratuite' : `${shippingCost.toFixed(2)} DH`}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">{finalTotal.toFixed(2)} DH</span>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={loading || cart.length === 0}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Traitement...</>
                  ) : (
                    'Valider la commande'
                  )}
                </Button>
                {loyaltyPointsToEarn > 0 && (
                  <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Gift className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="font-medium text-purple-900">Programme Fidélité</p>
                          <p className="text-purple-700">Vous gagnerez <strong>{loyaltyPointsToEarn} points</strong></p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
