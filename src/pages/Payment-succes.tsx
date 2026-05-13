import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | undefined>();
  const [amount, setAmount] = useState<number | undefined>();

  useEffect(() => {
    const raw = localStorage.getItem('pendingPayment');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setOrderId(parsed.orderId);
        setAmount(parsed.amount);
      } catch {
        // malformed — ignore
      }
      localStorage.removeItem('pendingPayment');
    }
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Paiement réussi</h1>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Merci pour votre commande. Votre paiement a été confirmé.
      </p>

      {orderId && (
        <p className="mb-1">
          <span className="font-semibold">Numéro de commande :</span> {orderId}
        </p>
      )}
      {amount !== undefined && (
        <p className="mb-4">
          <span className="font-semibold">Montant payé :</span>{" "}
          {amount.toLocaleString('fr-FR')} FCFA
        </p>
      )}

      <div className="flex gap-3 mt-4">
        <Button onClick={() => navigate("/orders")}>Voir mes commandes</Button>
        <Button variant="outline" onClick={() => navigate("/")}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
