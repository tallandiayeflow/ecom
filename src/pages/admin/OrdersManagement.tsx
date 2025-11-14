"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAllOrders, updateOrderStatus } from "@/lib/api";
import { Loader2, MoreHorizontal, Package, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { fetchOrders(); }, []);

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
      toast.success("Statut de commande mis à jour");
      fetchOrders();
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestion des commandes</h1>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="p-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En cours</option>
          <option value="shipped">Expédié</option>
          <option value="delivered">Livré</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-10 h-10 animate-spin text-gray-700 dark:text-gray-300" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <p className="text-gray-700 dark:text-gray-300">Aucune commande trouvée.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
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
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <td className="p-3 font-mono">{order.id.slice(0, 8)}</td>
                  <td>{order.shippingAddress?.name || "Inconnu"}</td>
                  <td>
                    <Badge variant={
                      order.status === "pending" ? "secondary" :
                      order.status === "processing" ? "warning" :
                      order.status === "shipped" ? "info" :
                      order.status === "delivered" ? "success" :
                      "default"
                    }>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="text-right">{order.total} FCFA</td>
                  <td className="text-right text-green-600">{order.discount > 0 ? `-${order.discount}` : "-"}</td>
                  <td className="text-right font-bold">{order.finalTotal} FCFA</td>
                  <td className="text-center text-purple-600">{order.voucherCode || "—"}</td>
                  <td>{order.items.length} <Package className="inline w-4 h-4 ml-1" /></td>
                  <td className="text-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} title="Voir détails">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      disabled={statusUpdating}
                      className="border rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    >
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh] relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Détails Commande #{selectedOrder.id.slice(0, 8)}</h2>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="p-1">
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </Button>
            </div>
            <Separator className="mb-4 dark:bg-gray-700" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
              <div className="space-y-1">
                <p><strong>Client:</strong> {selectedOrder.shippingAddress?.name}</p>
                <p><strong>Téléphone:</strong> {selectedOrder.shippingAddress?.phone}</p>
                <p><strong>Email:</strong> {selectedOrder.shippingAddress?.email || '—'}</p>
                <p><strong>Adresse:</strong> {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</p>
              </div>
              <div className="space-y-1">
                <p><strong>Statut:</strong> {selectedOrder.status}</p>
                <p><strong>Code Promo:</strong> {selectedOrder.voucherCode || 'Aucun'}</p>
                {selectedOrder.discount > 0 && <p className="text-green-600 font-semibold">Réduction: -{selectedOrder.discount} FCFA</p>}
                <p><strong>Total:</strong> {selectedOrder.total} FCFA</p>
                <p className="font-bold"><strong>Total Final:</strong> {selectedOrder.finalTotal} FCFA</p>
              </div>
            </div>
            <Separator className="my-4 dark:bg-gray-700" />
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Articles :</h3>
            <ul className="list-disc list-inside max-h-48 overflow-y-auto space-y-1">
              {selectedOrder.items.map(item => (
                <li key={item.id} className="dark:text-gray-200">
                  {item.productName} — {item.quantity} × {item.price} FCFA = {(item.quantity * item.price)} FCFA
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrdersManagement;