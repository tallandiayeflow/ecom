import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem('pendingPayment');
    if (raw) {
      try {
        const { orderId } = JSON.parse(raw);
        if (orderId) {
          api.post(`/payments/cancel-order/${orderId}`).catch(() => {});
        }
      } catch {
        // malformed — ignore
      }
      localStorage.removeItem('pendingPayment');
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <XCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Le paiement a été annulé. Votre commande a été supprimée et le stock restauré.
      </p>

      <div className="flex gap-3 mt-4">
        <Button onClick={() => navigate("/checkout")}>Réessayer</Button>
        <Button variant="outline" onClick={() => navigate("/cart")}>
          Retour au panier
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
