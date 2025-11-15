import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import type { CreateOrderData } from '@/lib/api';
import { createOrder, validateVoucher } from '@/lib/api';
import { ArrowLeft, Gift, Info, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const loyaltyPointsToEarn = user ? Math.floor(finalTotal / 100) : 0;

  useEffect(() => {
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Retirer le useEffect qui force la connexion
  // useEffect(() => {
  //   if (!user) {
  //     toast.error('Veuillez vous connecter pour passer commande');
  //     navigate('/auth?redirect=/checkout');
  //   }
  // }, [user, navigate]);

  useEffect(() => {
    // Auto-remplissage si utilisateur connecté
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
    if (!voucherCode.trim()) return toast.error('Veuillez entrer un code promo');
    setValidatingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, cartTotal);
      if (result.valid) {
        setDiscount(result.discount);
        setVoucherApplied(true);
        toast.success('Code promo appliqué !');
      } else {
        toast.error(result.message || 'Code promo invalide');
        setDiscount(0);
        setVoucherApplied(false);
      }
    } catch (error: any) {
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
    if (!formData.name || !formData.phone || !formData.address || !formData.city) 
      return toast.error('Veuillez remplir tous les champs');
    if (formData.phone.length < 10) return toast.error('Numéro invalide');

    setLoading(true);
    try {
      const orderData: CreateOrderData = {
        items: cart.map(item => ({ 
          productId: item.productId, 
          quantity: item.quantity, 
          price: item.product.price, 
          name: item.product.name 
        })),
        shippingAddress: { ...formData },
        voucherCode: voucherApplied ? voucherCode.toUpperCase() : undefined,
        discount,
        total: cartTotal,
        finalTotal,
      };

      const order = await createOrder(orderData);
      await clearCart();
      toast.success('Commande créée avec succès ! 🎉');
      navigate('/order-success', { 
        state: { 
          orderId: order.id, 
          total: finalTotal, 
          loyaltyPoints: order.loyaltyPointsEarned || 0,
          order 
        } 
      });
    } catch {
      toast.error('Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Finaliser la commande</h2>

      {/* Carte d'information pour inviter à s'inscrire */}
      {!user && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Conseil :</strong> <Link to="/auth" className="underline font-semibold">Inscrivez-vous</Link> pour bénéficier de{' '}
            <Gift className="inline w-4 h-4" /> <strong>points de fidélité</strong> et suivre vos commandes !
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['name', 'phone', 'address', 'city'].map((field) => (
          <div key={field}>
            <Label htmlFor={field}>
              {field === 'name' ? 'Nom complet *' : 
               field === 'phone' ? 'Téléphone *' : 
               field === 'address' ? 'Adresse complète *' : 'Ville *'}
            </Label>
            <Input 
              id={field} 
              name={field} 
              value={formData[field as keyof typeof formData]} 
              onChange={handleInputChange} 
              required 
            />
          </div>
        ))}
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
          <Button type="button" onClick={handleApplyVoucher} disabled={validatingVoucher}>
            {validatingVoucher ? <Loader2 className="animate-spin mr-2" /> : 'Appliquer'}
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={handleRemoveVoucher}>
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

      {user && loyaltyPointsToEarn > 0 && (
        <p className="text-sm text-muted-foreground">
          Programme Fidélité : Vous gagnerez {loyaltyPointsToEarn} points
        </p>
      )}

      <Separator />

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => navigate('/cart')} className="flex-1 mr-2">
          <ArrowLeft className="mr-2" />
          Retour au panier
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? <><Loader2 className="animate-spin mr-2" /> Traitement...</> : 'Valider la commande'}
        </Button>
      </div>
    </form>
  );
};

export default Checkout;
