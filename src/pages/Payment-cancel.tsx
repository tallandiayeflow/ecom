// src/pages/PaymentCancel.tsx
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <XCircle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        Le paiement a été annulé. Vous pouvez réessayer ou modifier votre commande.
      </p>

      <div className="flex gap-3 mt-4">
        <Button onClick={() => navigate("/checkout")}>
          Réessayer le paiement
        </Button>
        <Button variant="outline" onClick={() => navigate("/cart")}>
          Retour au panier
        </Button>
      </div>
    </div>
  );
};

export default PaymentCancel;
