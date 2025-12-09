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

import {
  Edit,
  Eye,
  Loader2,
  MessageCircle,
  Package,
  RefreshCcw,
  Trash,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Order, PaymentStatus } from "@/types/index";
import { toast } from "sonner";

// =====================================================
// PAGE GESTION DES COMMANDES – version améliorée
// =====================================================

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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] =
    useState<Order["status"]>("pending");
  const [editPaymentStatus, setEditPaymentStatus] =
    useState<PaymentStatus>("pending");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentReference, setEditPaymentReference] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const navigate = useNavigate();

  // ===========================================
  // Fetch commandes
  // ===========================================
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

  // ===========================================
  // Mise à jour rapide du statut
  // ===========================================
  const handleStatusChange = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
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

  // ===========================================
  // Suppression commande
  // ===========================================
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

  // ===========================================
  // Edition commande (dialog)
  // ===========================================
  const openEditDialog = (order: Order) => {
    setOrderToEdit(order);
    setEditOrderStatus(order.status);
    setEditPaymentStatus(order.paymentStatus ?? "pending");
    setEditPaymentMethod(order.paymentMethod ?? "");
    setEditPaymentReference(order.paymentReference ?? "");
    setEditDialogOpen(true);
  };

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

  // ===========================================
  // Filtrage recherche
  // ===========================================
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

  // ===========================================
  // Badge statut
  // ===========================================
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

  // ===========================================
  // Render page
  // ===========================================
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">📦 Gestion des commandes</h1>

      {/* =====================================================
         BARRE FILTRES + RECHERCHE
      ===================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <input
          type="text"
          placeholder="🔍 Rechercher : nom, téléphone, ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 rounded-lg border focus:ring focus:ring-primary/30"
        />

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="p-2 rounded-lg border"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>

        <input
          type="date"
          value={dateMin}
          onChange={(e) => setDateMin(e.target.value)}
          className="p-2 rounded-lg border"
        />

        <input
          type="date"
          value={dateMax}
          onChange={(e) => setDateMax(e.target.value)}
          className="p-2 rounded-lg border"
        />

        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="p-2 rounded-lg border"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
        <Button
          variant="outline"
          onClick={() => fetchOrders()}
          className="flex items-center gap-2 hover:bg-blue-50"
        >
          <RefreshCcw className="w-4 h-4 animate-spin-slow" /> Actualiser
        </Button>

        <style>
          {`
        .animate-spin-slow {
          animation: spin 2s linear infinite;
        }
      `}
        </style>
      </div>

      {/* =====================================================
         TABLEAU DESKTOP
      ===================================================== */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <p>Aucune commande trouvée.</p>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto border rounded-lg shadow-sm bg-white">
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
                  <th className="w-64 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const phone = order.shippingAddress?.phone?.replace(
                    /[^0-9]/g,
                    ""
                  );

                  return (
                    <tr key={order.id} className="border-t">
                      <td className="p-3 font-mono">{order.id.slice(0, 8)}</td>
                      <td>{order.shippingAddress?.name}</td>

                      <td>
                        <Badge variant={statusBadge(order.status)}>
                          {order.status}
                        </Badge>
                      </td>

                      <td>
                        <Badge
                          variant={
                            order.paymentStatus === "paid"
                              ? "success"
                              : order.paymentStatus === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </td>

                      <td>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>{order.total} FCFA</td>
                      <td>{order.discount ? `-${order.discount}` : "-"}</td>
                      <td className="font-bold">{order.finalTotal} FCFA</td>

                      <td>
                        {order.items.length}{" "}
                        <Package className="inline w-4 h-4 ml-1" />
                      </td>

                      <td className="flex items-center justify-center gap-2">
                        {/* Voir détails */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* WhatsApp */}
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => {
                            const msg = encodeURIComponent(
                              `Bonjour ${
                                order.shippingAddress?.name
                              }, concernant votre commande #${order.id.slice(
                                0,
                                8
                              )}…nous vous contactons pour vous tenir informé(e) que votre commande est en cours de traitement.`
                            );
                            window.open(
                              `https://wa.me/${phone}?text=${msg}`,
                              "_blank"
                            );
                          }}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>

                        {/* Edit */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditDialog(order)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => confirmDelete(order)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* =====================================================
             MOBILE CARDS
          ===================================================== */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => {
              const phone = order.shippingAddress?.phone?.replace(
                /[^0-9]/g,
                ""
              );

              return (
                <div
                  key={order.id}
                  className="border rounded-xl p-4 shadow-md bg-white"
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-semibold text-lg">
                      {order.shippingAddress?.name}
                    </p>
                    <Badge variant={statusBadge(order.status)}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm mb-3">
                    <p>
                      <strong>ID:</strong> {order.id.slice(0, 8)}
                    </p>
                    <p>
                      <strong>Total :</strong> {order.finalTotal} FCFA
                    </p>
                    <p>
                      <strong>Articles :</strong> {order.items.length}
                    </p>
                    <p>
                      <strong>Paiement :</strong> {order.paymentMethod || "—"} (
                      {order.paymentStatus})
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <Eye className="w-4 h-4" /> Détails
                    </Button>

                    {/* WhatsApp mobile */}
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => {
                        const msg = encodeURIComponent(
                          `Bonjour ${
                            order.shippingAddress?.name
                          }, concernant votre commande #${order.id.slice(
                            0,
                            8
                          )}…nous vous contactons pour vous tenir informé(e) que votre commande est en cours de traitement.`
                        );
                        window.open(
                          `https://wa.me/${phone}?text=${msg}`,
                          "_blank"
                        );
                      }}
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </Button>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(
                          order.id,
                          e.target.value as Order["status"]
                        )
                      }
                      disabled={statusUpdating}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="pending">En attente</option>
                      <option value="processing">En cours</option>
                      <option value="shipped">Expédiée</option>
                      <option value="delivered">Livrée</option>
                      <option value="cancelled">Annulée</option>
                    </select>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditDialog(order)}
                    >
                      <Edit className="w-4 h-4" /> Modifier
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmDelete(order)}
                    >
                      <Trash className="w-4 h-4" /> Supprimer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =====================================================
         PAGINATION
      ===================================================== */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            variant="outline"
          >
            Précédent
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            variant="outline"
          >
            Suivant
          </Button>
        </div>
      )}

      {/* =====================================================
         DIALOG SUPPRESSION
      ===================================================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer cette commande ?</p>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =====================================================
         DIALOG EDIT
      ===================================================== */}
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
                onChange={(e) =>
                  setEditOrderStatus(e.target.value as Order["status"])
                }
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
                onChange={(e) =>
                  setEditPaymentStatus(e.target.value as PaymentStatus)
                }
                className="w-full border rounded p-2"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">
                Méthode de paiement
              </label>
              <input
                type="text"
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Ex : Orange Money"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Référence paiement
              </label>
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
