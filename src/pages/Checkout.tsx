import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder, validateVoucher } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Gift } from 'lucide-react';
import QRCode from 'qrcode';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
  });

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    try {
      const result = await validateVoucher(voucherCode, cartTotal);
      if (result.valid) {
        setDiscount(result.discount);
        setVoucherApplied(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la validation du code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address || !formData.city) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    try {
      const order = await createOrder({
        items: cart,
        total: cartTotal,
        shippingAddress: formData,
        voucherCode: voucherApplied ? voucherCode : undefined,
      });

      clearCart();
      
      // Generate QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(order.qrCode, {
        width: 300,
        margin: 2,
      });

      // Navigate to order success page with order data
      navigate('/order-success', {
        state: {
          order,
          qrCode: qrCodeDataUrl,
        },
      });
    } catch (error) {
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  const finalTotal = cartTotal - discount;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Finaliser la commande</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Jean Dupont"
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
                        placeholder="+33 6 12 34 56 78"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="123 Rue de la Paix"
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
                      placeholder="Paris"
                      required
                    />
                  </div>

                  <Separator />

                  {/* Voucher Section */}
                  <div className="space-y-2">
                    <Label htmlFor="voucher">Code promo / Bon d'achat</Label>
                    <div className="flex gap-2">
                      <Input
                        id="voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Entrez votre code"
                        disabled={voucherApplied}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyVoucher}
                        disabled={voucherApplied || !voucherCode.trim()}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Appliquer
                      </Button>
                    </div>
                    {voucherApplied && (
                      <Badge className="bg-success text-success-foreground">
                        Code appliqué: {discount.toFixed(2)}€ de réduction
                      </Badge>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      'Valider la commande'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {item.product.price.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span className="font-semibold">{cartTotal.toFixed(2)}€</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Réduction</span>
                      <span className="font-semibold">-{discount.toFixed(2)}€</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Livraison</span>
                    <span className="font-semibold">Gratuite</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-primary text-2xl">
                    {finalTotal.toFixed(2)}€
                  </span>
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">🎁 Programme Fidélité</p>
                  <p className="text-muted-foreground">
                    Vous gagnerez {Math.floor(finalTotal / 10)} points de fidélité avec cette commande
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
