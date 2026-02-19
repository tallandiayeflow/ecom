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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { InventoryItem } from "@/lib/api";
import { facturesAPI, getImageUrl, stock } from "@/lib/api";
import type { CreateInvoiceItem, Invoice } from "@/types/invoices.ts";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Minus,
  Package,
  Percent,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  Smartphone,
  User,
  X,
  XCircle,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const generateInvoiceNumber = (): string =>
  `INV-${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;

const statusConfig = {
  paid: {
    label: "Payée",
    variant: "default" as const,
    className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    icon: CheckCircle,
  },
  pending: {
    label: "En attente",
    variant: "secondary" as const,
    className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Annulée",
    variant: "destructive" as const,
    className: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    icon: XCircle,
  },
};

const paymentMethodConfig = {
  cash_on_delivery: { label: "Espèces", icon: Package },
  card: { label: "Carte bancaire", icon: CreditCard },
  bank_transfer: { label: "Virement", icon: DollarSign },
  other: { label: "Autre", icon: Receipt },
  'espèces': { label: "Espèces", icon: Package },
  'Mobile Money': { label: "Mobile Money", icon: Smartphone },
};

const InvoicesManagement = () => {
  const navigate = useNavigate();

  // États principaux
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  // États création facture
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState<"pending" | "paid" | "cancelled">(
    "pending"
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash_on_delivery" | "card" | "bank_transfer" | "other"
  >("cash_on_delivery");
  const [selectedItems, setSelectedItems] = useState<Map<string, CreateInvoiceItem>>(new Map());
  const [taxRate, setTaxRate] = useState("20");
  const [discount, setDiscount] = useState("0");

  // États stock
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    if (isDialogOpen) loadInventory();
  }, [isDialogOpen]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await facturesAPI.getAll();
      setInvoices(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await stock.getInventory({ page: 1, limit: 1000 });
      setInventory(data.inventory.filter((p) => p.stock > 0));
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoadingInventory(false);
    }
  };

  const addProductToInvoice = (product: InventoryItem) => {
    const newMap = new Map(selectedItems);
    if (newMap.has(product.id)) {
      const item = newMap.get(product.id)!;
      if (item.quantity < product.stock) {
        item.quantity += 1;
        newMap.set(product.id, item);
      } else {
        toast.error(`Stock maximum atteint (${product.stock})`);
        return;
      }
    } else {
      newMap.set(product.id, {
        productId: product.id,
        name: product.name,
        productImage: product.imageUrl,
        unitPrice: product.price,
        quantity: 1,
      });
    }
    setSelectedItems(newMap);
    toast.success(`${product.name} ajouté`);
  };

  const removeProductFromInvoice = (productId: string) => {
    const newMap = new Map(selectedItems);
    newMap.delete(productId);
    setSelectedItems(newMap);
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    const newMap = new Map(selectedItems);
    const item = newMap.get(productId);
    if (!item) return;
    const product = inventory.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      newMap.delete(productId);
    } else if (quantity <= product.stock) {
      item.quantity = quantity;
      newMap.set(productId, item);
    } else {
      toast.error(`Stock insuffisant. Disponible: ${product.stock}`);
      return;
    }

    setSelectedItems(newMap);
  };

  const calculateTotals = () => {
    let amount = 0;
    selectedItems.forEach((item) => (amount += item.unitPrice * item.quantity));
    const discountAmount = parseFloat(discount) || 0;
    const amountAfterDiscount = Math.max(0, amount - discountAmount);
    const tax = amountAfterDiscount * ((parseFloat(taxRate) || 0) / 100);
    const total = amountAfterDiscount + tax;
    return { amount, discountAmount, tax, total };
  };

  const saveInvoice = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      return toast.error("Le nom et l'email du client sont requis");
    }
    if (selectedItems.size === 0) {
      return toast.error("Ajoutez au moins un produit à la facture");
    }

    try {
      setSubmitting(true);
      const items: CreateInvoiceItem[] = Array.from(selectedItems.values());

      await facturesAPI.create({
        invoiceNumber: generateInvoiceNumber(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerCity: customerCity.trim() || undefined,
        items,
        status: invoiceStatus,
        paymentMethod,
        taxRate: parseFloat(taxRate) || 0,
        discount: parseFloat(discount) || 0,
      });

      toast.success("Facture créée avec succès ! 🎉");
      setIsDialogOpen(false);
      resetForm();
      loadInvoices();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la création";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerCity("");
    setInvoiceStatus("pending");
    setPaymentMethod("cash_on_delivery");
    setSelectedItems(new Map());
    setTaxRate("20");
    setDiscount("0");
    setInventorySearch("");
  };

  const handleOpenDeleteDialog = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const deleteExistingInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      setSubmitting(true);
      await facturesAPI.delete(invoiceToDelete.id);
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceToDelete.id));
      toast.success("Facture supprimée ! 🗑️");
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      toast.loading("Génération du PDF...");
      await facturesAPI.downloadPdf(invoiceId);
      toast.dismiss();
      toast.success("PDF téléchargé !");
    } catch (error) {
      toast.dismiss();
      toast.error("Erreur lors du téléchargement");
    }
  };

  // Filtrage
  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      !search ||
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_email?.toLowerCase().includes(search.toLowerCase());

    const matchDate =
      !filterDate ||
      new Date(inv.created_at).toISOString().slice(0, 10) === filterDate;

    const matchStatus = filterStatus === "all" || inv.status === filterStatus;

    return matchSearch && matchDate && matchStatus;
  });

  const filteredInventory = inventory.filter((p) =>
    p.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  // Stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    totalRevenue: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + Number(i.total || 0), 0),
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Toutes les factures</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">Factures payées</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À encaisser</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">FCFA</p>
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
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Factures
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredInvoices.length} facture(s) • {stats.totalRevenue.toLocaleString()}{" "}
                FCFA
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsDialogOpen(true)} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Facture
              </Button>
              <Button variant="outline" onClick={loadInvoices} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, client, email..."
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
            <div className="flex gap-2">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full md:w-48 h-11"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
                <p className="text-muted-foreground max-w-md">
                  {search || filterDate || filterStatus !== "all"
                    ? "Aucune facture ne correspond aux filtres"
                    : "Créez votre première facture"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">N° Facture</TableHead>
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Paiement</TableHead>
                        <TableHead className="font-semibold text-right">Montant</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice, index) => {
                        const statusInfo = statusConfig[invoice.status];
                        const StatusIcon = statusInfo.icon;
                        const paymentInfo = paymentMethodConfig[invoice.payment_method] || {
                          label: "Autre",
                          icon: Receipt
                        };

                        return (
                          <motion.tr
                            key={invoice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group hover:bg-accent/50 transition-all duration-200 border-b"
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                  <Receipt className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-mono font-bold text-sm">
                                    {invoice.invoice_number}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    #{invoice.id?.slice(0, 8)}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{invoice.customer_name}</span>
                                </div>
                                {invoice.customer_city && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span>{invoice.customer_city}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span>{invoice.customer_email}</span>
                                </div>
                                {invoice.customer_phone && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{invoice.customer_phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                                <paymentInfo.icon className="h-3 w-3" />
                                {paymentInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <p className="font-bold text-lg text-primary">
                                {Number(invoice.total || 0).toLocaleString()} FCFA
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={statusInfo.variant} className={statusInfo.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                                  className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                  title="Voir"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDownloadPdf(invoice.id)}
                                  className="h-9 w-9 hover:bg-green-500/10 hover:text-green-500"
                                  title="Télécharger PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleOpenDeleteDialog(invoice)}
                                  className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredInvoices.map((invoice, index) => {
                    const statusInfo = statusConfig[invoice.status];
                    const StatusIcon = statusInfo.icon;
                    const paymentInfo = paymentMethodConfig[invoice.payment_method] || {
                      label: "Autre",
                      icon: Receipt
                    };

                    return (
                      <motion.div
                        key={invoice.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden border-primary/20">
                          <CardContent className="p-4 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-mono font-bold">{invoice.invoice_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {invoice.customer_name}
                                </p>
                              </div>
                              <Badge variant={statusInfo.variant} className={statusInfo.className}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{invoice.customer_email}</span>
                              </div>
                              {invoice.customer_phone && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Téléphone:</span>
                                  <span className="font-medium">{invoice.customer_phone}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">
                                  {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Paiement:</span>
                                <span className="font-medium">{paymentInfo.label}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t">
                                <span className="text-muted-foreground">Montant:</span>
                                <span className="font-bold text-primary text-lg">
                                  {Number(invoice.total || 0).toLocaleString()} FCFA
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPdf(invoice.id)}
                                className="flex-1"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDeleteDialog(invoice)}
                                className="flex-1 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Nouvelle Facture - SUITE */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Créer une nouvelle facture
            </DialogTitle>
            <DialogDescription>
              Ajoutez les informations du client et les produits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informations Client */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Informations Client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Nom complet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jean@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Téléphone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerCity">Ville</Label>
                  <Input
                    id="customerCity"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Dakar"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="customerAddress">Adresse complète</Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="123 Avenue de la République"
                  />
                </div>
              </div>
            </div>

            {/* Produits Sélectionnés */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Produits sélectionnés ({selectedItems.size})
              </h3>
              {selectedItems.size === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucun produit ajouté</p>
                </div>
              ) : (
                <ScrollArea className="h-64 border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(selectedItems.values()).map((item) => {
                        const itemTotal = item.unitPrice * item.quantity;
                        return (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.productImage && (
                                  <img
                                    src={item.productImage}
                                    alt={item.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                )}
                                <span className="font-medium">{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{item.unitPrice.toLocaleString()} FCFA</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() =>
                                    updateProductQuantity(item.productId, item.quantity - 1)
                                  }
                                  className="h-8 w-8"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateProductQuantity(
                                      item.productId,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-16 text-center h-8"
                                  min="1"
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() =>
                                    updateProductQuantity(item.productId, item.quantity + 1)
                                  }
                                  className="h-8 w-8"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">
                              {itemTotal.toLocaleString()} FCFA
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeProductFromInvoice(item.productId)}
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>

            {/* Stock Disponible */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ajouter depuis le stock
                </h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    className="pl-10 h-9"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingInventory ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    {inventorySearch
                      ? "Aucun produit trouvé"
                      : "Aucun produit en stock"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-72 border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {product.imageUrl && (
                                <img
                                  src={getImageUrl(product.imageUrl)}
                                  alt={product.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <span>{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.price.toLocaleString()} FCFA</TableCell>
                          <TableCell>
                            <Badge
                              variant={product.stock < 10 ? "destructive" : "secondary"}
                            >
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={selectedItems.has(product.id)}
                              onClick={() => addProductToInvoice(product)}
                            >
                              {selectedItems.has(product.id) ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Ajouté
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Ajouter
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>

            {/* Paramètres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceStatus">Statut de la facture</Label>
                <Select
                  value={invoiceStatus}
                  onValueChange={(v) => setInvoiceStatus(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_on_delivery">Espèces</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                    <SelectItem value="bank_transfer">Virement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  TVA (%)
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Remise (FCFA)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-6 rounded-lg border-2 border-primary/20 space-y-3">
              <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant HT:</span>
                <span className="font-medium">{totals.amount.toLocaleString()} FCFA</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Remise:</span>
                  <span className="font-medium">
                    -{totals.discountAmount.toLocaleString()} FCFA
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({taxRate}%):</span>
                <span className="font-medium">{totals.tax.toLocaleString()} FCFA</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-bold text-lg">Total TTC:</span>
                <span className="font-bold text-2xl text-primary">
                  {totals.total.toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button onClick={saveInvoice} disabled={submitting} className="min-w-[140px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer la facture
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la facture "
              <span className="font-semibold">{invoiceToDelete?.invoice_number}</span>" de{" "}
              <span className="font-semibold">{invoiceToDelete?.customer_name}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteExistingInvoice}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvoicesManagement;