import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserOrders } from '@/lib/api';
import type { Order } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  FileText,
  Gift,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Tag,
  Truck,
  User,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { label: string; color: string; icon: React.ReactNode }
    > = {
      pending: {
        label: 'En attente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
      },
      processing: {
        label: 'En traitement',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Package className="h-3 w-3" />,
      },
      shipped: {
        label: 'Expédiée',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Truck className="h-3 w-3" />,
      },
      delivered: {
        label: 'Livrée',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      cancelled: {
        label: 'Annulée',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    return (
      configs[status] || {
        label: status,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <AlertCircle className="h-3 w-3" />,
      }
    );
  };

  const getPaymentStatusConfig = (status?: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      paid: { label: 'Payé', color: 'text-green-600' },
      pending: { label: 'En attente', color: 'text-yellow-600' },
      failed: { label: 'Échoué', color: 'text-red-600' },
    };

    return (
      configs[status || 'pending'] || {
        label: 'Non spécifié',
        color: 'text-gray-600',
      }
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n}>
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Mes Commandes
          </h1>
          <p className="text-muted-foreground text-lg">
            Suivez l'état de vos commandes en temps réel
          </p>
        </motion.div>

        {/* Empty State */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="h-32 w-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Aucune commande</h2>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas encore passé de commande
            </p>
            <Button onClick={() => (window.location.href = '/products')} size="lg">
              <Package className="h-5 w-5 mr-2" />
              Découvrir nos produits
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Total',
                  value: orders.length,
                  icon: FileText,
                  color: 'text-blue-600',
                },
                {
                  label: 'En cours',
                  value: orders.filter((o) =>
                    ['pending', 'processing', 'shipped'].includes(o.status)
                  ).length,
                  icon: Clock,
                  color: 'text-orange-600',
                },
                {
                  label: 'Livrées',
                  value: orders.filter((o) => o.status === 'delivered').length,
                  icon: CheckCircle2,
                  color: 'text-green-600',
                },
                {
                  label: 'Annulées',
                  value: orders.filter((o) => o.status === 'cancelled').length,
                  icon: XCircle,
                  color: 'text-red-600',
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-4 text-center">
                      <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Liste des commandes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order, index) => {
                const statusConfig = getStatusConfig(order.status);
                const itemCount = order.items?.length || 0;
                const totalAmount = order.finalTotal ?? order.total;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                      <CardContent className="p-6 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              <p className="font-bold text-lg">
                                #{order.id.substring(0, 8)}...
                              </p>
                            </div>
                            {order.createdAt && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(order.createdAt), 'dd MMM yyyy à HH:mm', {
                                  locale: fr,
                                })}
                              </p>
                            )}
                          </div>

                          <Badge
                            variant="outline"
                            className={`${statusConfig.color} border-2 px-3 py-1 font-semibold`}
                          >
                            <span className="flex items-center gap-1">
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </Badge>
                        </div>

                        <Separator />

                        {/* Infos rapides */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              Articles
                            </p>
                            <p className="font-semibold">{itemCount} article(s)</p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Total
                            </p>
                            <p className="font-bold text-lg text-primary">
                              {totalAmount.toLocaleString('fr-FR')} FCFA
                            </p>
                          </div>

                          {order.shippingAddress?.city && (
                            <div className="space-y-1 col-span-2">
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Livraison
                              </p>
                              <p className="font-medium text-sm">
                                {order.shippingAddress.city}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Points de fidélité */}
                        {order.loyaltyPointsEarned && order.loyaltyPointsEarned > 0 && (
                          <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                            <Gift className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-medium text-orange-900">
                              {order.loyaltyPointsEarned} points gagnés
                            </span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          className="w-full group hover:bg-primary hover:text-white transition-all"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          Voir les détails
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Dialog Détails */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Détails de la commande
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 mt-4"
              >
                {/* Infos générales */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Numéro de commande</p>
                        <p className="font-semibold">{selectedOrder.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Date</p>
                        <p className="font-semibold">
                          {selectedOrder.createdAt
                            ? format(
                                new Date(selectedOrder.createdAt),
                                'dd MMMM yyyy à HH:mm',
                                { locale: fr }
                              )
                            : 'Non spécifiée'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Statut</p>
                        <Badge
                          variant="outline"
                          className={`${
                            getStatusConfig(selectedOrder.status).color
                          } border-2`}
                        >
                          {getStatusConfig(selectedOrder.status).label}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Montant total</p>
                        <p className="font-bold text-lg text-primary">
                          {(
                            selectedOrder.finalTotal ?? selectedOrder.total
                          ).toLocaleString('fr-FR')}{' '}
                          FCFA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Client */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Informations client
                  </h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Nom</p>
                          <p className="font-medium">
                            {selectedOrder.shippingAddress?.name || 'Non spécifié'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1 flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            Téléphone
                          </p>
                          <p className="font-medium">
                            {selectedOrder.shippingAddress?.phone || 'Non spécifié'}
                          </p>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <p className="text-muted-foreground mb-1 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Adresse de livraison
                          </p>
                          <p className="font-medium">
                            {selectedOrder.shippingAddress?.address},{' '}
                            {selectedOrder.shippingAddress?.city}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Articles */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Articles commandés ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium mb-1">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} × {item.price.toLocaleString('fr-FR')} FCFA
                                </p>
                              </div>
                              <p className="font-bold text-lg whitespace-nowrap">
                                {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Paiement */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Paiement
                  </h3>
                  <Card>
                    <CardContent className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Méthode :</span>
                        <span className="font-medium">
                          {selectedOrder.paymentMethod || 'Non spécifiée'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Statut :</span>
                        <span
                          className={`font-medium ${
                            getPaymentStatusConfig(selectedOrder.paymentStatus).color
                          }`}
                        >
                          {getPaymentStatusConfig(selectedOrder.paymentStatus).label}
                        </span>
                      </div>
                      {selectedOrder.paymentReference && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Référence :</span>
                          <span className="font-mono text-xs">
                            {selectedOrder.paymentReference}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* Récapitulatif */}
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Récapitulatif
                  </h3>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">Sous-total :</span>
                        <span className="font-medium">
                          {selectedOrder.total.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>

                      {selectedOrder.discount && selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-base text-green-600">
                          <span className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Réduction {selectedOrder.voucherCode && `(${selectedOrder.voucherCode})`}
                          </span>
                          <span className="font-semibold">
                            -{selectedOrder.discount.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between items-baseline pt-2">
                        <span className="font-bold text-lg">Total final :</span>
                        <span className="font-bold text-2xl text-primary">
                          {(
                            selectedOrder.finalTotal ?? selectedOrder.total
                          ).toLocaleString('fr-FR')}{' '}
                          FCFA
                        </span>
                      </div>

                      {selectedOrder.loyaltyPointsEarned &&
                        selectedOrder.loyaltyPointsEarned > 0 && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg mt-3">
                            <Gift className="h-5 w-5 text-orange-600" />
                            <span className="text-sm font-semibold text-orange-900">
                              Points de fidélité gagnés : {selectedOrder.loyaltyPointsEarned}
                            </span>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </section>

                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full mt-4 hover:bg-primary hover:text-white transition-all"
                  size="lg"
                >
                  Fermer
                </Button>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Orders;
