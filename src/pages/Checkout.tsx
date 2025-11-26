import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import type { CreateOrderData } from "@/lib/api";
import { createOrder, requestPaytechPayment, validateVoucher } from "@/lib/api";
import { ArrowLeft, Gift, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Checkout = () => {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
  });

  const shippingCost = cartTotal >= 500 ? 0 : 50;
  const finalTotal = cartTotal - discount + shippingCost;
  const loyaltyPointsToEarn = user ? Math.floor(finalTotal / 5000) : 0;

  useEffect(() => {
    if (cart.length === 0) {
      toast.error("Votre panier est vide");
      navigate("/cart");
    }
  }, [cart, navigate]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
      });
    }
  }, [user]);

  if (cart.length === 0) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Veuillez entrer un code promo");
      return;
    }
    setValidatingVoucher(true);
    try {
      const result = await validateVoucher(voucherCode, cartTotal);
      if (result.valid) {
        setDiscount(result.discount);
        setVoucherApplied(true);
        toast.success("Code promo appliqué !");
      } else {
        toast.error(result.message || "Code promo invalide");
        setDiscount(0);
        setVoucherApplied(false);
      }
    } catch (error: any) {
      toast.error("Erreur lors de la validation du code");
      setDiscount(0);
      setVoucherApplied(false);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucherCode("");
    setDiscount(0);
    setVoucherApplied(false);
    toast.info("Code promo retiré");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address || !formData.city) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (formData.phone.length < 10) {
      toast.error("Numéro invalide");
      return;
    }
    if (cart.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }

    setLoading(true);

    try {
      const orderData: CreateOrderData & { payment_method: string; user_id?: string } = {
        order_id: 'temp',
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

      if (paymentMethod === "cod") {
        const order = await createOrder(orderData);
        toast.success("Commande créée avec succès ! 🎉");
        await clearCart();
        navigate("/order-success", {
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
            "Erreur lors de la préparation du paiement en ligne : " +
              (response.message || "")
          );
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la création de la commande");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Finaliser la commande</h2>

      {!user && (
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Conseil :</strong>{" "}
            <Link to="/auth" className="underline font-semibold">
              Inscrivez-vous
            </Link>{" "}
            pour bénéficier de <Gift className="inline w-4 h-4" />{" "}
            <strong>points de fidélité</strong> et suivre vos commandes !
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["name", "phone", "address", "city"].map((field) => (
          <div key={field}>
            <Label htmlFor={field}>
              {field === "name"
                ? "Nom complet *"
                : field === "phone"
                ? "Téléphone ( avec l'indicatif) *"
                : field === "address"
                ? "Adresse complète *"
                : "Ville *"}
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
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          disabled={voucherApplied || validatingVoucher}
          className="flex-1"
        />
        {!voucherApplied ? (
          <Button type="button" onClick={handleApplyVoucher} disabled={validatingVoucher}>
            {validatingVoucher ? <Loader2 className="animate-spin mr-2" /> : "Appliquer"}
          </Button>
        ) : (
          <Button type="button" variant="destructive" onClick={handleRemoveVoucher}>
            Retirer
          </Button>
        )}
      </div>

      {voucherApplied && (
        <p className="text-green-600 font-semibold">
          Code appliqué : -{discount.toFixed(2)} Fcfa
        </p>
      )}

      <Separator />

      <div>
        {cart.map((item) => (
          <div key={item.productId} className="flex justify-between mb-2">
            <div>{item.product.name}</div>
            <div>
              {item.quantity} × {item.product.price.toFixed(2)} Fcfa ={" "}
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
          <div>{shippingCost === 0 ? "Gratuite" : `${shippingCost.toFixed(2)} Fcfa`}</div>
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

      <div>
        <label className="block font-semibold mb-2">Méthode de paiement</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setPaymentMethod("online")}
            className={`p-4 rounded-lg border text-left w-full flex items-center justify-between cursor-pointer transition-shadow ${
              paymentMethod === "online"
                ? "border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                : "border-gray-200 hover:shadow"
            }`}
            aria-pressed={paymentMethod === "online"}
          >
            <div>
              <div className="font-medium">Payer en ligne</div>
              <div className="text-sm text-muted-foreground">Wave, Orange Money...</div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === "online" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {paymentMethod === "online" ? "✓" : ""}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("cod")}
            className={`p-4 rounded-lg border text-left w-full flex items-center justify-between cursor-pointer transition-shadow ${
              paymentMethod === "cod"
                ? "border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                : "border-gray-200 hover:shadow"
            }`}
            aria-pressed={paymentMethod === "cod"}
          >
            <div>
              <div className="font-medium">Payer à la livraison</div>
              <div className="text-sm text-muted-foreground">Paiement en espèces ou mobile à la livraison</div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                paymentMethod === "cod" ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {paymentMethod === "cod" ? "✓" : ""}
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => navigate("/cart")} className="flex-1 mr-2">
          <ArrowLeft className="mr-2" />
          Retour au panier
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" /> Traitement...
            </>
          ) : (
            "Valider la commande"
          )}
        </Button>
      </div>
    </form>
  );
};

export default Checkout;
