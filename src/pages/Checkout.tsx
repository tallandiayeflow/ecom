import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { CreateOrderData } from '@/lib/api';
import { createOrder, validateVoucher } from '@/lib/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
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

  const shippingCost = cartTotal >= 500 ? 0 : 50;
  const finalTotal = cartTotal - discount + shippingCost;
  const loyaltyPointsToEarn = Math.floor(finalTotal / 100);

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
        voucherCode: voucherApplied ? voucherCode.toUpperCase() : undefined,
        discount: discount,
        total: cartTotal,
        finalTotal: finalTotal,
      };

      const order = await createOrder(orderData);
      await clearCart();

      toast.success('Commande créée avec succès ! 🎉');
      navigate('/order-success', {
        state: {
          orderId: order.id,
          total: finalTotal,
          loyaltyPoints: loyaltyPointsToEarn,
          order: order,
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Finaliser la commande</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom complet *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone *</Label>
          <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="address">Adresse complète *</Label>
          <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Entrez votre code promo"
          value={voucherCode}
          onChange={e => setVoucherCode(e.target.value.toUpperCase())}
          disabled={voucherApplied || validatingVoucher}
          className="flex-1"
        />
        {!voucherApplied ? (
          <Button onClick={handleApplyVoucher} disabled={validatingVoucher}>
            {validatingVoucher ? <Loader2 className="animate-spin mr-2" /> : 'Appliquer'}
          </Button>
        ) : (
          <Button variant="destructive" onClick={handleRemoveVoucher}>
            Retirer
          </Button>
        )}
      </div>

      {voucherApplied && (
        <p className="text-green-600 font-semibold">Code appliqué : -{discount.toFixed(2)} Fcfa</p>
      )}

      <Separator />

      <div>
        {cart.map(item => (
          <div key={item.productId} className="flex justify-between mb-2">
            <div>{item.product.name}</div>
            <div>
              {item.quantity} × {item.product.price.toFixed(2)} Fcfa ={' '}
              {(item.product.price * item.quantity).toFixed(2)} Fcfa
            </div>
          </div>
        ))}
        <div className="flex justify-between font-semibold mt-4">
          <div>Sous-total ({cartCount} articles)</div>
          <div>{cartTotal.toFixed(2)} Fcfa</div>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-semibold text-green-600">
            <div>Réduction</div>
            <div>-{discount.toFixed(2)} Fcfa</div>
          </div>
        )}
        <div className="flex justify-between font-semibold mt-2">
          <div>Livraison</div>
          <div>{shippingCost === 0 ? 'Gratuite' : `${shippingCost.toFixed(2)} Fcfa`}</div>
        </div>
        <div className="flex justify-between font-bold text-lg mt-4">
          <div>Total</div>
          <div>{finalTotal.toFixed(2)} Fcfa</div>
        </div>
      </div>

      {loyaltyPointsToEarn > 0 && (
        <p className="text-sm text-muted-foreground">
          Programme Fidélité : Vous gagnerez {loyaltyPointsToEarn} points
        </p>
      )}

      <Separator />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/cart')}>
          <ArrowLeft className="mr-2" />
          Retour au panier
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Traitement...
            </>
          ) : (
            'Valider la commande'
          )}
        </Button>
      </div>
    </form>
  );
};

export default Checkout;
