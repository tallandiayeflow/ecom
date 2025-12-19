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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createVoucher, deleteVoucher, getVouchers, updateVoucher } from "@/lib/api";
import type { VoucherData } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Gift,
  Hash,
  Loader2,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Tag,
  Ticket,
  Trash2,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<VoucherData | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<Omit<VoucherData, "id" | "usedCount" | "createdAt">>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minPurchase: 0,
    maxUses: null,
    validFrom: "",
    validUntil: "",
    isActive: true,
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await getVouchers();
      setVouchers(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des codes promo");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (voucher?: VoucherData) => {
    if (voucher) {
      setSelectedVoucher(voucher);
      setIsNew(false);
      setForm({
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minPurchase: voucher.minPurchase,
        maxUses: voucher.maxUses,
        validFrom: voucher.validFrom?.slice(0, 16) ?? "",
        validUntil: voucher.validUntil?.slice(0, 16) ?? "",
        isActive: voucher.isActive,
      });
    } else {
      setSelectedVoucher(null);
      setIsNew(true);
      setForm({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        minPurchase: 0,
        maxUses: null,
        validFrom: "",
        validUntil: "",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedVoucher(null);
    setIsNew(false);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("Le code est obligatoire");
      return;
    }

    if (form.discountValue <= 0) {
      toast.error("La valeur de réduction doit être positive");
      return;
    }

    if (form.discountType === "percentage" && form.discountValue > 100) {
      toast.error("Le pourcentage ne peut pas dépasser 100%");
      return;
    }

    try {
      setSubmitting(true);
      if (isNew) {
        await createVoucher(form);
        toast.success("Code promo créé avec succès ! 🎉");
      } else if (selectedVoucher) {
        await updateVoucher(selectedVoucher.id!, form);
        toast.success("Code promo mis à jour ! ✅");
      }
      closeDialog();
      fetchVouchers();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (voucher: VoucherData) => {
    setVoucherToDelete(voucher);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!voucherToDelete) return;
    try {
      setSubmitting(true);
      await deleteVoucher(voucherToDelete.id!);
      toast.success("Code promo supprimé ! 🗑️");
      setDeleteDialogOpen(false);
      setVoucherToDelete(null);
      fetchVouchers();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVouchers = vouchers.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.code.toLowerCase().includes(q);
  });

  // Stats
  const stats = {
    total: vouchers.length,
    active: vouchers.filter((v) => v.isActive).length,
    inactive: vouchers.filter((v) => !v.isActive).length,
    totalUsed: vouchers.reduce((sum, v) => sum + (v.usedCount || 0), 0),
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Ticket className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Codes promo</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-gray-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Désactivés</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisations</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.totalUsed}</div>
            <p className="text-xs text-muted-foreground">Total utilisés</p>
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
                  <Gift className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Codes Promo
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredVouchers.length} code(s) • {stats.totalUsed} utilisation(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openDialog()} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={fetchVouchers} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un code promo..."
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
            ) : filteredVouchers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Gift className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun code promo</h3>
                <p className="text-muted-foreground max-w-md">
                  {search
                    ? "Aucun code promo ne correspond à votre recherche"
                    : "Créez votre premier code promo pour offrir des réductions"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Code</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Réduction</TableHead>
                        <TableHead className="font-semibold">Min Achat</TableHead>
                        <TableHead className="font-semibold text-center">Utilisations</TableHead>
                        <TableHead className="font-semibold">Période</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVouchers.map((voucher, index) => (
                        <motion.tr
                          key={voucher.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Tag className="h-5 w-5 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-mono font-bold">{voucher.code}</p>
                                <p className="text-xs text-muted-foreground">
                                  #{voucher.id?.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {voucher.discountType === "percentage" ? (
                                <>
                                  <Percent className="h-3 w-3 mr-1" />
                                  Pourcentage
                                </>
                              ) : (
                                <>
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  Fixe
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-primary text-lg">
                              {voucher.discountType === "percentage"
                                ? `${voucher.discountValue}%`
                                : `${voucher.discountValue.toLocaleString()} FCFA`}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                              <span>{voucher.minPurchase.toLocaleString()} FCFA</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <p className="font-semibold">
                                {voucher.usedCount || 0} / {voucher.maxUses || "∞"}
                              </p>
                              {voucher.maxUses && (
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className="bg-primary rounded-full h-2 transition-all"
                                    style={{
                                      width: `${Math.min(
                                        ((voucher.usedCount || 0) / voucher.maxUses) * 100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {voucher.validFrom?.slice(0, 10) || "N/A"}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {voucher.validUntil?.slice(0, 10) || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={voucher.isActive ? "default" : "secondary"}
                              className={
                                voucher.isActive
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                  : ""
                              }
                            >
                              {voucher.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Actif
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactif
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDialog(voucher)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDeleteDialog(voucher)}
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
                  {filteredVouchers.map((voucher, index) => (
                    <motion.div
                      key={voucher.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Tag className="h-6 w-6 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-mono font-bold">{voucher.code}</p>
                                <Badge
                                  variant={voucher.isActive ? "default" : "secondary"}
                                  className={
                                    voucher.isActive ? "bg-green-500/10 text-green-500" : ""
                                  }
                                >
                                  {voucher.isActive ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Type:</span>
                              <span className="font-medium">
                                {voucher.discountType === "percentage"
                                  ? "Pourcentage"
                                  : "Fixe"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Réduction:</span>
                              <span className="font-bold text-primary">
                                {voucher.discountType === "percentage"
                                  ? `${voucher.discountValue}%`
                                  : `${voucher.discountValue.toLocaleString()} FCFA`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Min Achat:</span>
                              <span className="font-medium">
                                {voucher.minPurchase.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Utilisations:</span>
                              <span className="font-medium">
                                {voucher.usedCount || 0} / {voucher.maxUses || "∞"}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                            <p>Début: {voucher.validFrom?.slice(0, 10) || "N/A"}</p>
                            <p>Fin: {voucher.validUntil?.slice(0, 10) || "N/A"}</p>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog(voucher)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDeleteDialog(voucher)}
                              className="flex-1 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ajout/Édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {isNew ? "Créer un code promo" : "Modifier le code promo"}
            </DialogTitle>
            <DialogDescription>
              {isNew
                ? "Créez un nouveau code promo pour offrir des réductions"
                : `Modifier le code ${selectedVoucher?.code}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Code promo *
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="PROMO2025"
                required
                disabled={submitting}
                className="font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Type de réduction *
                </Label>
                <Select
                  value={form.discountType}
                  onValueChange={(value: "percentage" | "fixed") =>
                    setForm({ ...form, discountType: value })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Pourcentage (%)
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Montant fixe (FCFA)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Valeur *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="1"
                  max={form.discountType === "percentage" ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: Number(e.target.value) })
                  }
                  placeholder={form.discountType === "percentage" ? "10" : "5000"}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPurchase" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Achat minimum (FCFA)
                </Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min="0"
                  value={form.minPurchase}
                  onChange={(e) => setForm({ ...form, minPurchase: Number(e.target.value) })}
                  placeholder="0"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Utilisations max
                </Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="0"
                  value={form.maxUses || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxUses: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Illimité"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début
                </Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date d'expiration
                </Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="font-semibold">
                  Code actif
                </Label>
                <p className="text-sm text-muted-foreground">
                  Les clients pourront utiliser ce code
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                disabled={submitting}
              />
            </div>

            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Conseil:</strong> Les codes courts et mémorables sont plus
                efficaces
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isNew ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Enregistrer
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
              Êtes-vous sûr de vouloir supprimer le code promo "
              <span className="font-semibold">{voucherToDelete?.code}</span>" ? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default VouchersManagement;
