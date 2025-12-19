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
import {
  createFlashSale,
  deleteFlashSale,
  getFlashSalesAdmin,
  getProducts,
} from "@/lib/api";
import type { FlashSale, Product } from "@/types";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Clock,
  Edit,
  Flame,
  Loader2,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const FlashSalesManagement = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [deletingSale, setDeletingSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    discountPrice: "",
    startDate: "",
    endDate: "",
    stock: "100",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [salesData, productsData] = await Promise.all([
        getFlashSalesAdmin(),
        getProducts({ limit: 1000 }),
      ]);
      setFlashSales(salesData);
      setProducts(productsData.products);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sale?: FlashSale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        productId: sale.productId,
        discountPrice: sale.discountPrice.toString(),
        startDate: format(new Date(sale.startDate), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(sale.endDate), "yyyy-MM-dd'T'HH:mm"),
        stock: sale.stock.toString(),
      });
    } else {
      setEditingSale(null);
      setFormData({
        productId: "",
        discountPrice: "",
        startDate: "",
        endDate: "",
        stock: "100",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.discountPrice || !formData.startDate || !formData.endDate) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    const selectedProduct = products.find((p) => p.id === formData.productId);
    if (selectedProduct && parseFloat(formData.discountPrice) >= selectedProduct.price) {
      toast.error("Le prix flash doit être inférieur au prix normal");
      return;
    }

    try {
      setSubmitting(true);
      const saleData = {
        productId: formData.productId,
        discountPrice: parseFloat(formData.discountPrice),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        stock: parseInt(formData.stock),
      };

      if (editingSale) {
        await deleteFlashSale(editingSale.id);
        await createFlashSale(saleData);
        toast.success("Vente flash modifiée avec succès ! ✅");
      } else {
        await createFlashSale(saleData);
        toast.success("Vente flash ajoutée avec succès ! 🎉");
      }

      setIsDialogOpen(false);
      loadInitialData();
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (sale: FlashSale) => {
    setDeletingSale(sale);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSale) return;
    try {
      setSubmitting(true);
      await deleteFlashSale(deletingSale.id);
      toast.success("Vente flash supprimée avec succès ! 🗑️");
      setIsDeleteDialogOpen(false);
      setDeletingSale(null);
      loadInitialData();
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrage recherche
  const filteredSales = flashSales.filter((sale) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return sale.product?.name?.toLowerCase().includes(q);
  });

  // Stats
  const stats = {
    total: flashSales.length,
    active: flashSales.filter((s) => s.isActive).length,
    inactive: flashSales.filter((s) => !s.isActive).length,
    totalDiscount: flashSales.reduce(
      (sum, s) => sum + (s.product ? s.product.price - s.discountPrice : 0),
      0
    ),
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventes</CardTitle>
            <Flame className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Toutes les ventes flash</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-gray-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactives</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Terminées ou futures</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Économies</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {stats.totalDiscount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">FCFA économisés</p>
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
                  <Flame className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Ventes Flash
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredSales.length} vente(s) • {stats.active} active(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenDialog()} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={loadInitialData} disabled={loading}>
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
              placeholder="Rechercher un produit..."
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchTerm("")}
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
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Flame className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune vente flash</h3>
                <p className="text-muted-foreground max-w-md">
                  {searchTerm
                    ? "Aucune vente flash ne correspond à votre recherche"
                    : "Créez votre première vente flash pour booster vos ventes"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Produit</TableHead>
                        <TableHead className="font-semibold">Prix Normal</TableHead>
                        <TableHead className="font-semibold">Prix Flash</TableHead>
                        <TableHead className="font-semibold text-center">Réduction</TableHead>
                        <TableHead className="font-semibold">Période</TableHead>
                        <TableHead className="font-semibold text-center">Stock</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale, index) => (
                        <motion.tr
                          key={sale.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {sale.product?.images?.[0] && (
                                <img
                                  src={sale.product.images[0]}
                                  alt={sale.product.name}
                                  className="h-12 w-12 object-cover rounded-lg"
                                />
                              )}
                              <div className="space-y-1">
                                <p className="font-medium">{sale.product?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  #{sale.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {sale.product?.price.toLocaleString()} FCFA
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-bold text-primary text-lg">
                              {sale.discountPrice.toLocaleString()} FCFA
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
                              <Percent className="h-3 w-3 mr-1" />
                              -{sale.discountPercentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(sale.startDate), "dd/MM/yyyy HH:mm")}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(sale.endDate), "dd/MM/yyyy HH:mm")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{sale.stock}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={sale.isActive ? "default" : "secondary"}
                              className={
                                sale.isActive
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                  : ""
                              }
                            >
                              {sale.isActive ? (
                                <>
                                  <Zap className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDialog(sale)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDeleteDialog(sale)}
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
                  {filteredSales.map((sale, index) => (
                    <motion.div
                      key={sale.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start gap-3">
                            {sale.product?.images?.[0] && (
                              <img
                                src={sale.product.images[0]}
                                alt={sale.product.name}
                                className="h-16 w-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold">{sale.product?.name}</p>
                              <Badge
                                variant={sale.isActive ? "default" : "secondary"}
                                className={
                                  sale.isActive
                                    ? "bg-green-500/10 text-green-500"
                                    : ""
                                }
                              >
                                {sale.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Prix normal:</span>
                              <span className="font-medium">
                                {sale.product?.price.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Prix flash:</span>
                              <span className="font-bold text-primary">
                                {sale.discountPrice.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Réduction:</span>
                              <Badge className="bg-red-500/10 text-red-500">
                                -{sale.discountPercentage}%
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Stock:</span>
                              <span className="font-medium">{sale.stock}</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                            <p>
                              Début: {format(new Date(sale.startDate), "dd/MM/yyyy HH:mm")}
                            </p>
                            <p>Fin: {format(new Date(sale.endDate), "dd/MM/yyyy HH:mm")}</p>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(sale)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDeleteDialog(sale)}
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              {editingSale ? "Modifier la vente flash" : "Ajouter une vente flash"}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de votre vente flash pour créer l'urgence
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Produit *
              </Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
                disabled={submitting}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-6 w-6 object-cover rounded"
                          />
                        )}
                        <span>
                          {product.name} - {product.price.toLocaleString()} FCFA
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPrice" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Prix promotionnel (FCFA) *
                </Label>
                <Input
                  id="discountPrice"
                  type="number"
                  step="1"
                  min="1"
                  value={formData.discountPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPrice: e.target.value })
                  }
                  placeholder="9999"
                  required
                  disabled={submitting}
                />
                {formData.productId && formData.discountPrice && (
                  <p className="text-xs text-muted-foreground">
                    Réduction:{" "}
                    {(
                      ((products.find((p) => p.id === formData.productId)?.price || 0) -
                        parseFloat(formData.discountPrice)) /
                      (products.find((p) => p.id === formData.productId)?.price || 1) *
                      100
                    ).toFixed(0)}
                    %
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock disponible *
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début *
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Date de fin *
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Conseil:</strong> Les ventes flash courtes (2-6h) créent plus
                d'urgence et génèrent plus de conversions.
              </p>
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
              <Button type="submit" disabled={submitting} className="min-w-[120px]">
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : editingSale ? (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la vente flash pour "
              <span className="font-semibold">{deletingSale?.product?.name}</span>" ? Cette
              action est irréversible.
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

export default FlashSalesManagement;
