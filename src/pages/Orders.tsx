"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { getUserOrders } from "@/lib/api";
import type { Order } from "@/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Loader2, MapPin, Package, Phone, User } from "lucide-react";
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
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        Mes Commandes
      </h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground">Aucune commande trouvée</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-full border rounded-xl p-4 flex justify-between items-center 
              hover:bg-muted/30 hover:shadow-lg transition-all 
              dark:bg-muted/10 bg-white/70 backdrop-blur-sm 
              focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`Voir détails commande ${order.id.substring(0, 8)}`}
            >
              <div>
                <p className="font-semibold text-lg">
                  Commande #{order.id.substring(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), "dd MMM yyyy", { locale: fr })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-lg">
                  {(order.finalTotal ?? order.total).toFixed(2)} DH
                </p>
                <p
                  className={`text-xs mt-1 ${
                    order.status === "delivered"
                      ? "text-green-500"
                      : order.status === "pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {order.status === "shipped"
                    ? "Livrée"
                    : order.status === "pending"
                    ? "En cours"
                    : "Annulée"}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Détails de la commande */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="fixed top-1/2 left-1/2 max-w-3xl max-h-[85vh] w-full 
          -translate-x-1/2 -translate-y-1/2 overflow-y-auto 
          bg-background text-foreground rounded-2xl shadow-2xl p-6 border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Détails de la commande
            </DialogTitle>
            <DialogDescription>
              Commande #{selectedOrder?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-4"
            >
              {/* Informations client */}
              <section className="bg-muted/40 dark:bg-muted/20 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Informations client
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nom</p>
                    <p className="font-medium">
                      {selectedOrder.shippingAddress?.name || "Non spécifié"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone className="w-4 h-4" /> Téléphone
                    </p>
                    <p className="font-medium">
                      {selectedOrder.shippingAddress?.phone || "Non spécifié"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> Adresse de livraison
                    </p>
                    <p className="font-medium">
                      {selectedOrder.shippingAddress?.address},{" "}
                      {selectedOrder.shippingAddress?.city}
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Articles commandés */}
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
                      className="flex items-center gap-3 p-3 bg-muted/20 dark:bg-muted/10 rounded-lg border"
                    >
                      <div className="rounded-lg bg-background p-2 border flex-shrink-0">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base mb-1">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantité: {item.quantity} × {(item.price || 0).toFixed(2)} DH
                        </p>
                      </div>
                      <p className="font-semibold whitespace-nowrap">
                        {((item.price || 0) * item.quantity).toFixed(2)} DH
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>

              <Separator />

              <div className="flex justify-between items-center font-semibold text-lg">
                <p>Total :</p>
                <p className="text-primary">
                  {(selectedOrder.finalTotal ?? selectedOrder.total).toFixed(2)} DH
                </p>
              </div>

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
