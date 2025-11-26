import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteOrder, getOrder, updateOrderStatus } from "@/lib/api";
import { Order } from "@/types/index";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";



const OrderDetailUpdate = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrder(id)
      .then((data) => setOrder(data))
      .catch(() => toast.error("Erreur lors du chargement de la commande"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setStatusUpdating(true);
    try {
      await updateOrderStatus(order.id, newStatus as Order["status"]);
      toast.success("Statut mis à jour avec succès");
      setOrder({ ...order, status: newStatus as Order["status"] });
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    if (!window.confirm("Confirmez-vous la suppression de cette commande ? Cette action est irréversible.")) return;

    setDeleting(true);
    try {
      await deleteOrder(order.id);
      toast.success("Commande supprimée avec succès");
      navigate("/orders");
    } catch {
      toast.error("Erreur lors de la suppression de la commande");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!order) return <p>Commande introuvable.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Détails de la commande #{order.id.slice(0, 8)}</h1>

      <section>
        <h2 className="font-semibold text-lg mb-2">Informations client</h2>
        <p><strong>Nom :</strong> {order.shippingAddress.name}</p>
        <p><strong>Téléphone :</strong> {order.shippingAddress.phone}</p>
        <p><strong>Adresse :</strong> {order.shippingAddress.address}, {order.shippingAddress.city}</p>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">Articles commandés</h2>
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between mb-1">
            <span>{item.name}</span>
            <span>{item.quantity} × {item.price.toFixed(2)} Fcfa</span>
          </div>
        ))}
        <div className="mt-2 font-bold">Total : {order.finalTotal?.toFixed(2) ?? order.total.toFixed(2)} Fcfa</div>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">Statut et paiement</h2>
        <div className="mb-2 flex items-center gap-4">
          <span>Statut :</span>
          <Badge variant={
              order.status === "pending" ? "secondary" :
              order.status === "processing" ? "warning" :
              order.status === "shipped" ? "info" :
              order.status === "delivered" ? "success" : "destructive"
            }
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          <select
            disabled={statusUpdating}
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="pending">En attente</option>
            <option value="processing">En cours</option>
            <option value="shipped">Expédiée</option>
            <option value="delivered">Livrée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
        <div><strong>Méthode paiement :</strong> {order.paymentMethod || "-"}</div>
        <div><strong>Statut paiement :</strong> {order.paymentStatus || "-"}</div>
        {order.paymentReference && <div><strong>Référence paiement :</strong> {order.paymentReference}</div>}
      </section>

      <section className="flex gap-4 mt-6">
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Suppression..." : "Supprimer la commande"}
        </Button>
        <Button onClick={() => navigate("/orders")}>Retour à la liste</Button>
      </section>
    </div>
  );
};

export default OrderDetailUpdate;
