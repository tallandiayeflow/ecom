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
import { deleteOrder, getAllOrders, updateOrderDetails } from "@/lib/api";

import { Edit, Eye, Loader2, Package, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import type { Order, PaymentStatus } from "@/types/index";

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [dateMin, setDateMin] = useState("");
  const [dateMax, setDateMax] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  

  // Dialog edition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<Order["status"]>("pending");
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>("pending");
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>("");
  const [editPaymentReference, setEditPaymentReference] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [page, perPage, filterStatus, dateMin, dateMax]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        date_min: dateMin || undefined,
        date_max: dateMax || undefined,
        limit: perPage,
        offset: (page - 1) * perPage,
        status: filterStatus || undefined,
      };
      const data = await getAllOrders(params);
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  // Met à jour seulement le statut via dropdown rapide
  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    setStatusUpdating(true);
    try {
      await updateOrderDetails(orderId, { status: newStatus });
      toast.success("Statut mis à jour");
      fetchOrders();
    } catch {
      toast.error("Erreur durant la mise à jour");
    } finally {
      setStatusUpdating(false);
    }
  };

  const confirmDelete = (order: Order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      toast.success("Commande supprimée");
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setTotal((t) => t - 1);
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  // Ouvrir dialogue édition avec données chargées
  const openEditDialog = (order: Order) => {
    setOrderToEdit(order);
    setEditOrderStatus(order.status);
    setEditPaymentStatus(order.paymentStatus ?? "pending");
    setEditPaymentMethod(order.paymentMethod ?? "");
    setEditPaymentReference(order.paymentReference ?? "");
    setEditDialogOpen(true);
  };

  // Sauvegarde modifications complètes
  const saveEdit = async () => {
    if (!orderToEdit) return;
    setSavingEdit(true);
    try {
      await updateOrderDetails(orderToEdit.id, {
        status: editOrderStatus,
        payment_method: editPaymentMethod,
        payment_status: editPaymentStatus,
        payment_reference: editPaymentReference,
      });
      toast.success("Mise à jour effectuée");
      setEditDialogOpen(false);
      setOrderToEdit(null);
      fetchOrders();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase();
    const ship = order.shippingAddress;
    return (
      ship?.name?.toLowerCase().includes(q) ||
      ship?.phone?.toLowerCase().includes(q) ||
      ship?.city?.toLowerCase().includes(q) ||
      ship?.address?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / perPage);

  const statusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "warning";
      case "shipped":
        return "info";
      case "delivered":
        return "success";
      default:
        return "destructive";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Gestion des commandes</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 rounded border"
        />

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="p-2 rounded border"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>

        <input type="date" value={dateMin} onChange={(e) => setDateMin(e.target.value)} className="p-2 rounded border" />
        <input type="date" value={dateMax} onChange={(e) => setDateMax(e.target.value)} className="p-2 rounded border" />

        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="p-2 rounded border"
        >
          <option value={10}>10 par page</option>
          <option value={20}>20 par page</option>
          <option value={50}>50 par page</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <p>Aucune commande trouvée.</p>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Paiement</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Réduction</th>
                  <th>Total final</th>
                  <th>Articles</th>
                  <th className="w-56 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t">
                    <td className="p-3 font-mono">{order.id.slice(0, 8)}</td>
                    <td>{order.shippingAddress?.name}</td>

                    <td>
                      <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
                    </td>

                    <td>
                      <div className="text-xs">
                        <Badge
                          variant={
                            order.paymentStatus === "paid"
                              ? "success"
                              : order.paymentStatus === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {order.paymentStatus || "pending"}
                        </Badge>
                      </div>
                    </td>

                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>

                    <td>{order.total} FCFA</td>
                    <td>{order.discount ? `-${order.discount}` : "-"}</td>
                    <td className="font-bold">{order.finalTotal} FCFA</td>

                    <td>
                      {order.items.length} <Package className="inline w-4 h-4 ml-1" />
                    </td>

                    <td className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${order.id}`)} title="Voir les détails">
                        <Eye className="w-4 h-4" />
                      </Button>


                      <Button size="sm" variant="destructive" onClick={() => confirmDelete(order)} title="Supprimer la commande">
                        <Trash className="w-4 h-4" />
                      </Button>

                      <Button size="sm" variant="secondary" onClick={() => openEditDialog(order)} title="Modifier informations paiement et statut">
                        Modifier
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold">{order.shippingAddress?.name}</p>
                  <Badge variant={statusBadge(order.status)}>{order.status}</Badge>
                </div>

                <p className="text-sm">ID: {order.id.slice(0, 8)}</p>
                <p className="text-sm">Total: {order.finalTotal} FCFA</p>
                <p className="text-sm">Paiement: {order.paymentMethod || "—"} ({order.paymentStatus})</p>
                <p className="text-sm">Articles: {order.items.length}</p>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${order.id}`)}>
                    <Eye className="w-4 h-4" /> Détails
                  </Button>

                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                    disabled={statusUpdating}
                    className="border rounded px-2 py-1 text-sm"
                    title="Modifier le statut"
                  >
                    <option value="pending">En attente</option>
                    <option value="processing">En cours</option>
                    <option value="shipped">Expédiée</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>

                  <Button size="sm" variant="destructive" onClick={() => confirmDelete(order)}>
                    <Trash className="w-4 h-4" /> Supprimer
                  </Button>

                  <Button size="sm" variant="secondary" onClick={() => openEditDialog(order)} title="Modifier infos paiement et statut">
                    <Edit className="w-4 h-4" /> Modifier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} variant="outline">
            Précédent
          </Button>
          <span>Page {page} / {totalPages}</span>
          <Button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages} variant="outline">
            Suivant
          </Button>
        </div>
      )}

      {/* DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer cette commande ?</p>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="block font-medium mb-1">Statut commande</label>
              <select
                value={editOrderStatus}
                onChange={(e) => setEditOrderStatus(e.target.value as Order["status"])}
                className="w-full border rounded p-2"
              >
                <option value="pending">En attente</option>
                <option value="processing">En cours</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Statut paiement</label>
              <select
                value={editPaymentStatus}
                onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full border rounded p-2"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Méthode de paiement</label>
              <input
                type="text"
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Ex : Orange Money"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Référence paiement</label>
              <input
                type="text"
                value={editPaymentReference}
                onChange={(e) => setEditPaymentReference(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Référence de transaction"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
