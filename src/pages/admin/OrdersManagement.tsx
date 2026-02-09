"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteOrder, getAllOrders, updateOrderDetails } from "@/lib/api";
import type { Order, PaymentStatus } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Edit,
  Eye,
  Filter,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

const OrdersManagement = () => {
  const navigate = useNavigate();

  // State pour les commandes
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Filtres et recherche
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateMin, setDateMin] = useState("");
  const [dateMax, setDateMax] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialog suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Dialog édition
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>("pending");
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>("pending");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editPaymentReference, setEditPaymentReference] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Dialog détails
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page, perPage, filterStatus, dateMin, dateMax, search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: perPage,
        offset: (page - 1) * perPage,
      };

      if (filterStatus && filterStatus !== "all") {
        params.status = filterStatus;
      }
      if (dateMin) params.date_min = dateMin;
      if (dateMax) params.date_max = dateMax;
      if (search) params.search = search;

      const data = await getAllOrders(params);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error("Erreur lors du chargement des commandes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Actions

  // Mise à jour rapide du statut
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setStatusUpdating(true);
    try {
      await updateOrderDetails(orderId, { status: newStatus });
      toast.success("Statut mis à jour ! ✅");
      fetchOrders();
    } catch {
      toast.error("Erreur durant la mise à jour");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Suppression
  const confirmDelete = (order: Order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete.id);
      toast.success("Commande supprimée 🗑️");
      fetchOrders();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  // Édition
  const openEditDialog = (order: Order) => {
    setOrderToEdit(order);
    setEditOrderStatus(order.status as OrderStatus);
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
      toast.success("Mise à jour effectuée ! ✅");
      setEditDialogOpen(false);
      setOrderToEdit(null);
      fetchOrders();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingEdit(false);
    }
  };

  // Voir détails
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  // WhatsApp
  const sendWhatsApp = (order: Order) => {
    const phone = order.shippingAddress?.phone?.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `Bonjour ${order.shippingAddress?.name}, concernant votre commande #${order.id.slice(
        0,
        8
      )}… nous vous contactons pour vous tenir informé(e) que votre commande est en cours de traitement.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  // Configuration des statuts
  const statusConfig: Record<OrderStatus, { label: string; icon: any; className: string }> = {
    pending: {
      label: "En attente",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    },
    processing: {
      label: "En traitement",
      icon: Package,
      className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    },
    shipped: {
      label: "Expédiée",
      icon: Truck,
      className: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
    },
    delivered: {
      label: "Livrée",
      icon: PackageCheck,
      className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    },
    cancelled: {
      label: "Annulée",
      icon: XCircle,
      className: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    },
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as OrderStatus];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentBadge = (status?: PaymentStatus) => {
    if (status === "paid") {
      return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Payé</Badge>;
    }
    if (status === "failed") {
      return <Badge variant="destructive">Échoué</Badge>;
    }
    return <Badge variant="secondary">En attente</Badge>;
  };

  // Stats
  const stats = {
    total: total,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.finalTotal || o.total), 0),
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Toutes les commandes</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Traitement</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrées</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Complétées</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Commandes
              </CardTitle>
              <CardDescription className="text-sm">
                {orders.length} commande(s) • {stats.revenue.toLocaleString()} FCFA
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={fetchOrders}
              disabled={loading}
              className="transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Recherche */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher : nom, téléphone, ville..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filtre statut */}
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="h-11">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>

            {/* Date min */}
            <Input
              type="date"
              value={dateMin}
              onChange={(e) => setDateMin(e.target.value)}
              className="h-11"
            />

            {/* Date max */}
            <Input
              type="date"
              value={dateMax}
              onChange={(e) => setDateMax(e.target.value)}
              className="h-11"
            />

            {/* Items par page */}
            <Select value={perPage.toString()} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune commande trouvée</h3>
                <p className="text-muted-foreground max-w-md">
                  {search || filterStatus !== "all" || dateMin || dateMax
                    ? "Essayez de modifier vos critères de recherche"
                    : "Les commandes apparaîtront ici une fois qu'elles seront passées"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Réduction</TableHead>
                        <TableHead className="font-semibold">Final</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-center">Paiement</TableHead>
                        <TableHead className="font-semibold text-center">Articles</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <p className="font-mono font-semibold text-sm">
                              #{order.id.slice(0, 8)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{order.shippingAddress?.name || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.shippingAddress?.phone || "N/A"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("fr-FR")
                                : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{order.total.toLocaleString()} FCFA</p>
                          </TableCell>
                          <TableCell>
                            {order.discount && order.discount > 0 ? (
                              <p className="text-sm text-green-500">
                                -{order.discount.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-muted-foreground">-</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-primary">
                              {(order.finalTotal || order.total).toLocaleString()} FCFA
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(order.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getPaymentBadge(order.paymentStatus)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">{order.items?.length || 0}</span>
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewDetails(order)}
                                className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => sendWhatsApp(order)}
                                className="h-9 w-9 hover:bg-green-500/10 hover:text-green-500"
                                title="Envoyer WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(order)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => confirmDelete(order)}
                                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-semibold">{order.shippingAddress?.name || "N/A"}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                #{order.id.slice(0, 8)}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Total:</span>
                              <span className="font-bold text-primary">
                                {(order.finalTotal || order.total).toLocaleString()} FCFA
                              </span>
                            </div>
                            {order.discount && order.discount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Réduction:</span>
                                <span className="text-green-500">-{order.discount.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Articles:</span>
                              <span>{order.items?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Paiement:</span>
                              {getPaymentBadge(order.paymentStatus)}
                            </div>
                          </div>

                          {/* Actions Mobile */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(order)}
                              className="w-full"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Détails
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendWhatsApp(order)}
                              className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-600"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(order)}
                              className="w-full"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmDelete(order)}
                              className="w-full text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>

                          {/* Status Quick Change Mobile */}
                          <Select
                            value={order.status}
                            onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus)}
                            disabled={statusUpdating}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="processing">En traitement</SelectItem>
                              <SelectItem value="shipped">Expédiée</SelectItem>
                              <SelectItem value="delivered">Livrée</SelectItem>
                              <SelectItem value="cancelled">Annulée</SelectItem>
                            </SelectContent>
                          </Select>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> sur{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Détails de la commande
            </DialogTitle>
            <DialogDescription>Commande #{selectedOrder?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Info Client */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations Client
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom</Label>
                    <p className="font-medium">{selectedOrder.shippingAddress?.name || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Téléphone</Label>
                    <p className="font-medium">{selectedOrder.shippingAddress?.phone || "N/A"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="font-medium">
                      {selectedOrder.createdAt
                        ? new Date(selectedOrder.createdAt).toLocaleString("fr-FR")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse de Livraison
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg space-y-1">
                  <p className="font-medium">{selectedOrder.shippingAddress?.address || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shippingAddress?.city || ""}
                  </p>
                </div>
              </div>

              {/* Articles */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Articles ({selectedOrder.items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.name}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qté: {item.quantity} • {item.price.toLocaleString()} FCFA
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {item.selectedColor && (
                            <span className="text-xs text-muted-foreground mr-2">
                              Couleur: {item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-xs text-muted-foreground">
                              Taille: {item.selectedSize}
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="font-bold text-primary">
                        {(item.price * item.quantity).toLocaleString()} FCFA
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résumé */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Résumé
                </h3>
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{selectedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                  {selectedOrder.discount && selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Réduction</span>
                      <span className="font-medium text-green-500">
                        -{selectedOrder.discount.toLocaleString()} FCFA
                      </span>
                    </div>
                  )}
                  {selectedOrder.voucherCode && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Code promo</span>
                      <Badge variant="secondary">{selectedOrder.voucherCode}</Badge>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {(selectedOrder.finalTotal || selectedOrder.total).toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              </div>

              {/* Paiement */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Méthode:</span>
                  <span>{selectedOrder.paymentMethod || "Non spécifié"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut paiement:</span>
                  {getPaymentBadge(selectedOrder.paymentStatus)}
                </div>
                {selectedOrder.paymentReference && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Référence:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {selectedOrder.paymentReference}
                    </code>
                  </div>
                )}
              </div>

              {/* Statut actuel */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Statut:</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    openEditDialog(selectedOrder);
                  }}
                >
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Edit */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Modifier la commande
            </DialogTitle>
            <DialogDescription>Commande #{orderToEdit?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Statut commande</Label>
              <Select
                value={editOrderStatus}
                onValueChange={(v) => setEditOrderStatus(v as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processing">En traitement</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut paiement</Label>
              <Select
                value={editPaymentStatus}
                onValueChange={(v) => setEditPaymentStatus(v as PaymentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Méthode de paiement</Label>
              <Input
                value={editPaymentMethod}
                onChange={(e) => setEditPaymentMethod(e.target.value)}
                placeholder="Ex : Orange Money, Wave..."
              />
            </div>

            <div className="space-y-2">
              <Label>Référence paiement</Label>
              <Input
                value={editPaymentReference}
                onChange={(e) => setEditPaymentReference(e.target.value)}
                placeholder="Référence de transaction"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit} className="min-w-[100px]">
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Delete */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la commande{" "}
              <span className="font-semibold">#{orderToDelete?.id.slice(0, 8)}</span> ? Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersManagement;
