"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteOrder, getAllOrders, updateOrderStatus } from "@/lib/api";
import { Eye, Loader2, Package, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch {
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success("Statut mis à jour");
      fetchOrders();
    } catch {
      toast.error("Erreur durant la mise à jour");
    } finally {
      setStatusUpdating(false);
    }
  };

  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;

    try {
      await deleteOrder(orderToDelete.id);
      toast.success("Commande supprimée");
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = search.toLowerCase();
    const matchesSearch =
      order.shippingAddress?.name?.toLowerCase().includes(query) ||
      order.shippingAddress?.phone?.toLowerCase().includes(query) ||
      order.shippingAddress?.email?.toLowerCase().includes(query);

    const matchesStatus = filterStatus ? order.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        Gestion des commandes
      </h1>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin text-gray-700 dark:text-gray-300" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">Aucune commande trouvée.</p>
      ) : (
        <>
          {/* TABLEAU pour medium et plus */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Total</th>
                  <th>Réduction</th>
                  <th>Total Final</th>
                  <th>Code Promo</th>
                  <th>Articles</th>
                  <th className="text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="p-3 font-mono">{order.id.slice(0, 8)}</td>
                    <td>{order.shippingAddress?.name || "Inconnu"}</td>
                    <td>
                      <Badge
                        variant={
                          order.status === "pending"
                            ? "secondary"
                            : order.status === "processing"
                            ? "warning"
                            : order.status === "shipped"
                            ? "info"
                            : order.status === "delivered"
                            ? "success"
                            : "destructive"
                        }
                      >
                        {order.status === "pending"
                          ? "En attente"
                          : order.status === "processing"
                          ? "En cours"
                          : order.status === "shipped"
                          ? "Expédiée"
                          : order.status === "delivered"
                          ? "Livrée"
                          : "Annulée"}
                      </Badge>
                    </td>
                    <td className="text-right">{order.total} FCFA</td>
                    <td className="text-right text-green-600">
                      {order.discount > 0 ? `-${order.discount}` : "-"}
                    </td>
                    <td className="text-right font-bold">{order.finalTotal} FCFA</td>
                    <td className="text-center text-purple-600">
                      {order.voucherCode || "—"}
                    </td>
                    <td>
                      {order.items.length} <Package className="inline w-4 h-4 ml-1" />
                    </td>
                    <td className="flex items-center gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={statusUpdating}
                        className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      >
                        <option value="pending">En attente</option>
                        <option value="processing">En cours</option>
                        <option value="shipped">Expédiée</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDelete(order)}
                        title="Supprimer"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARTES pour mobile */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-xl p-4 shadow-sm dark:bg-muted/10 dark:border-gray-700"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-base">{order.shippingAddress?.name || "Inconnu"}</p>
                  <Badge
                    variant={
                      order.status === "pending"
                        ? "secondary"
                        : order.status === "processing"
                        ? "warning"
                        : order.status === "shipped"
                        ? "info"
                        : order.status === "delivered"
                        ? "success"
                        : "destructive"
                    }
                  >
                    {order.status === "pending"
                      ? "En attente"
                      : order.status === "processing"
                      ? "En cours"
                      : order.status === "shipped"
                      ? "Expédiée"
                      : order.status === "delivered"
                      ? "Livrée"
                      : "Annulée"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">ID: {order.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground mb-1">Total: {order.finalTotal} FCFA</p>
                <p className="text-sm text-muted-foreground mb-1">Articles: {order.items.length}</p>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <Eye className="w-4 h-4" /> Détails
                  </Button>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={statusUpdating}
                    className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">En cours</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => confirmDelete(order)}
                  >
                    <Trash className="w-4 h-4" /> Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>

          <p>
            Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est
            irréversible.
          </p>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>

            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
