"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getUserOrders } from "@/lib/api";
import type { Order } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Loader2, MapPin, Package, Phone, Tag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch {
      toast.error("❌ Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        Mes Commandes
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground">Aucune commande trouvée</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-muted/10 rounded-2xl shadow-md p-5 flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg md:text-xl">
                    Commande #{order.id.substring(0, 8)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "dd MMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg md:text-xl">
                    {(order.finalTotal ?? order.total).toFixed(2)} FCFA
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-800"
                        : order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {order.status === "delivered"
                      ? "Livrée"
                      : order.status === "pending"
                      ? "En cours"
                      : "Annulée"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-3 hover:bg-primary hover:text-white transition"
                onClick={() => setSelectedOrder(order)}
              >
                Voir les détails
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Détails de la commande */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="fixed top-1/2 left-1/2 max-w-3xl max-h-[85vh] w-full -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-background text-foreground rounded-2xl shadow-2xl p-6 border border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Détails de la commande
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-4"
            >
              {/* Client */}
              <section className="bg-muted/40 dark:bg-muted/20 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Informations client
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nom</p>
                    <p className="font-medium">{selectedOrder.shippingAddress?.name || "Non spécifié"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-4 h-4" /> Téléphone
                    </p>
                    <p className="font-medium">{selectedOrder.shippingAddress?.phone || "Non spécifié"}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Adresse de livraison
                    </p>
                    <p className="font-medium">
                      {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Articles */}
              <section>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" /> Articles commandés
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/20 dark:bg-muted/10 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base mb-1">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity} × {(item.price || 0).toFixed(2)} FCFA
                        </p>
                      </div>
                      <p className="font-semibold whitespace-nowrap text-right sm:text-left">
                        {((item.price || 0) * item.quantity).toFixed(2)} FCFA
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>

              <Separator />

              {/* Totaux */}
              <section className="space-y-2">
                <div className="flex justify-between items-center text-base">
                  <p className="text-muted-foreground">Sous-total :</p>
                  <p className="font-medium">{selectedOrder.total.toFixed(2)} FCFA</p>
                </div>

                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between items-center text-base text-green-600">
                    <p className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Réduction ({selectedOrder.voucherCode}) :
                    </p>
                    <p className="font-semibold">-{selectedOrder.discount.toFixed(2)} FCFA</p>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between items-center font-semibold text-lg pt-2">
                  <p>Total final :</p>
                  <p className="text-primary">{(selectedOrder.finalTotal ?? selectedOrder.total).toFixed(2)} FCFA</p>
                </div>

                {selectedOrder.loyaltyPointsEarned > 0 && (
                  <p className="text-sm text-blue-600 mt-2">
                    🎁 Points de fidélité gagnés : {selectedOrder.loyaltyPointsEarned}
                  </p>
                )}
              </section>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="mt-6 w-full hover:bg-primary hover:text-white transition"
              >
                Fermer
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
