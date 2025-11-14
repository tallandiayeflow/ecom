// Improved Checkout component with dark mode and responsive design

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

  if (cart.length === 0 || !user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return toast.error('Veuillez entrer un code promo');
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
      toast.error('Erreur lors de la validation du code');
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
    if (!formData.name || !formData.phone || !formData.address || !formData.city) return toast.error('Veuillez remplir tous les champs');
    if (formData.phone.length < 10) return toast.error('Numéro invalide');

    setLoading(true);
    try {
      const orderData: CreateOrderData = {
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.product.price, name: item.product.name })),
        shippingAddress: { ...formData },
        voucherCode: voucherApplied ? voucherCode.toUpperCase() : undefined,
        discount,
        total: cartTotal,
        finalTotal,
      };

      const order = await createOrder(orderData);
      await clearCart();
      toast.success('Commande créée avec succès ! 🎉');
      navigate('/order-success', { state: { orderId: order.id, total: finalTotal, loyaltyPoints: loyaltyPointsToEarn, order } });
    } catch {
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center">Finaliser la commande</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['name','phone','address','city'].map((field) => (
          <div key={field} className="flex flex-col">
            <Label htmlFor={field} className="mb-1 text-gray-700 dark:text-gray-300">{field === 'name' ? 'Nom complet *' : field === 'phone' ? 'Téléphone *' : field === 'address' ? 'Adresse complète *' : 'Ville *'}</Label>
            <Input id={field} name={field} value={formData[field]} onChange={handleInputChange} className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" required />
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Entrez votre code promo"
          value={voucherCode}
          onChange={e => setVoucherCode(e.target.value.toUpperCase())}
          disabled={voucherApplied || validatingVoucher}
          className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />
        {!voucherApplied ? (
          <Button onClick={handleApplyVoucher} disabled={validatingVoucher} className="flex-shrink-0">
            {validatingVoucher ? <Loader2 className="animate-spin mr-2" /> : 'Appliquer'}
          </Button>
        ) : (
          <Button variant="destructive" onClick={handleRemoveVoucher} className="flex-shrink-0">Retirer</Button>
        )}
      </div>

      {voucherApplied && <p className="text-green-600 font-semibold">Code appliqué : -{discount.toFixed(2)} Fcfa</p>}

      <Separator className="dark:bg-gray-700" />

      <div className="space-y-2">
        {cart.map(item => (
          <div key={item.productId} className="flex justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800">
            <span className="font-medium">{item.product.name} ({item.quantity}×{item.product.price.toFixed(2)})</span>
            <span className="font-semibold">{(item.product.price * item.quantity).toFixed(2)} Fcfa</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-2">
          <span>Sous-total ({cartCount} articles)</span>
          <span>{cartTotal.toFixed(2)} Fcfa</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between font-semibold text-green-600">
            <span>Réduction</span>
            <span>-{discount.toFixed(2)} Fcfa</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>Livraison</span>
          <span>{shippingCost === 0 ? 'Gratuite' : `${shippingCost.toFixed(2)} Fcfa`}</span>
        </div>
        <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-300 dark:border-gray-700">
          <span>Total</span>
          <span>{finalTotal.toFixed(2)} Fcfa</span>
        </div>
      </div>

      {loyaltyPointsToEarn > 0 && (
        <p className="text-sm text-blue-700 dark:text-blue-300">Programme Fidélité : Vous gagnerez {loyaltyPointsToEarn} points</p>
      )}

      <Separator className="dark:bg-gray-700" />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/cart')} className="flex-1">
          <ArrowLeft className="mr-2" /> Retour au panier
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? <><Loader2 className="animate-spin mr-2" /> Traitement...</> : 'Valider la commande'}
        </Button>
      </div>
    </form>
  );
};

export default Checkout;