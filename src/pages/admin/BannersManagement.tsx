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
import { Textarea } from "@/components/ui/textarea";
import {
  createBanner,
  deleteBanner,
  getBanners,
  getProducts,
  getImageUrl,
} from "@/lib/api";
import type { BannerSlide, Product } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Edit,
  Eye,
  Image as ImageIcon,
  Loader2,
  MonitorPlay,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const BannersManagement = () => {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<BannerSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    productId: "",
    title: "",
    subtitle: "",
    displayOrder: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [bannersData, productsData] = await Promise.all([
        getBanners(),
        getProducts({ limit: 1000 }),
      ]);
      setBanners(bannersData);
      setProducts(productsData.products);
    } catch (error: any) {
      console.error("Erreur de chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (banner?: BannerSlide) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        productId: banner.productId || "",
        title: banner.title,
        subtitle: banner.subtitle || "",
        displayOrder: banner.order,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        productId: "",
        title: "",
        subtitle: "",
        displayOrder: banners.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.title) {
      toast.error("Veuillez remplir les champs requis");
      return;
    }

    try {
      setSubmitting(true);
      const bannerData = {
        productId: formData.productId,
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        displayOrder: formData.displayOrder,
      };

      if (editingBanner) {
        await deleteBanner(editingBanner.id);
        await createBanner(bannerData);
        toast.success("Bannière modifiée avec succès ! ✅");
      } else {
        await createBanner(bannerData);
        toast.success("Bannière ajoutée avec succès ! 🎉");
      }
      setIsDialogOpen(false);
      loadInitialData();
    } catch (error: any) {
      console.error("Erreur:", error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la sauvegarde";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (banner: BannerSlide) => {
    setDeletingBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBanner) return;
    try {
      setSubmitting(true);
      await deleteBanner(deletingBanner.id);
      toast.success("Bannière supprimée avec succès ! 🗑️");
      setIsDeleteDialogOpen(false);
      setDeletingBanner(null);
      loadInitialData();
    } catch (error: any) {
      console.error("Erreur:", error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
    setBanners(newBanners);
    toast.info("Position modifiée (temporaire)");
  };

  const moveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    setBanners(newBanners);
    toast.info("Position modifiée (temporaire)");
  };

  // Filtrage recherche
  const filteredBanners = banners.filter((banner) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      banner.title?.toLowerCase().includes(q) ||
      banner.subtitle?.toLowerCase().includes(q) ||
      banner.product?.name?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total: banners.length,
    active: banners.filter((b) => b.isActive).length,
    inactive: banners.filter((b) => !b.isActive).length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bannières</CardTitle>
            <MonitorPlay className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Dans le slider</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Affichées</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-gray-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactives</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Masquées</p>
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
                  <MonitorPlay className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Bannières
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredBanners.length} bannière(s) • Slider page d'accueil
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
              placeholder="Rechercher une bannière..."
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
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-20 w-32 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredBanners.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MonitorPlay className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune bannière</h3>
                <p className="text-muted-foreground max-w-md">
                  {searchTerm
                    ? "Aucune bannière ne correspond à votre recherche"
                    : "Créez votre première bannière pour le slider"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Aperçu</TableHead>
                        <TableHead className="font-semibold">Titre</TableHead>
                        <TableHead className="font-semibold">Sous-titre</TableHead>
                        <TableHead className="font-semibold">Produit</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-center">Ordre</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBanners.map((banner, index) => (
                        <motion.tr
                          key={banner.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <div className="relative h-20 w-32 rounded-lg overflow-hidden bg-muted">
                              {banner.product?.images?.[0] ? (
                                <img
                                  src={getImageUrl(banner.product.images[0])}
                                  alt={banner.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold">{banner.title}</p>
                              <p className="text-xs text-muted-foreground">
                                #{banner.id.slice(0, 8)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {banner.subtitle || "-"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{banner.product?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {banner.product?.price.toLocaleString()} FCFA
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={banner.isActive ? "default" : "secondary"}
                              className={
                                banner.isActive
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                  : ""
                              }
                            >
                              {banner.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveUp(index)}
                                disabled={index === 0 || submitting}
                                className="h-8 w-8 hover:bg-primary/10"
                                title="Monter"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium w-6 text-center">
                                {banner.order}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveDown(index)}
                                disabled={index === banners.length - 1 || submitting}
                                className="h-8 w-8 hover:bg-primary/10"
                                title="Descendre"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDialog(banner)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDeleteDialog(banner)}
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
                  {filteredBanners.map((banner, index) => (
                    <motion.div
                      key={banner.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="relative h-20 w-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {banner.product?.images?.[0] ? (
                                <img
                                  src={getImageUrl(banner.product.images[0])}
                                  alt={banner.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold">{banner.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {banner.subtitle || "-"}
                              </p>
                              <Badge
                                variant={banner.isActive ? "default" : "secondary"}
                                className={
                                  banner.isActive ? "bg-green-500/10 text-green-500" : ""
                                }
                              >
                                {banner.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Produit:</span>
                              <span className="font-medium">{banner.product?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Prix:</span>
                              <span className="font-medium">
                                {banner.product?.price.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ordre:</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveUp(index)}
                                  disabled={index === 0}
                                  className="h-7 w-7"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <span className="font-medium">{banner.order}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => moveDown(index)}
                                  disabled={index === banners.length - 1}
                                  className="h-7 w-7"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(banner)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDeleteDialog(banner)}
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
              <MonitorPlay className="h-5 w-5 text-primary" />
              {editingBanner ? "Modifier la bannière" : "Ajouter une bannière"}
            </DialogTitle>
            <DialogDescription>
              Configurez votre bannière pour le slider de la page d'accueil
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Produit vedette *
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
                            src={getImageUrl(product.images[0])}
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

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Titre *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Nouveau iPhone 15 Pro"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Sous-titre
              </Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="ex: Jusqu'à -30% de réduction"
                disabled={submitting}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order" className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4" />
                Ordre d'affichage
              </Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: parseInt(e.target.value) })
                }
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Les bannières avec un ordre plus petit apparaissent en premier
              </p>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Conseil:</strong> Utilisez des images de haute qualité et des
                titres accrocheurs pour maximiser l'impact
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
                ) : editingBanner ? (
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
              Êtes-vous sûr de vouloir supprimer la bannière "
              <span className="font-semibold">{deletingBanner?.title}</span>" ? Cette action est
              irréversible.
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

export default BannersManagement;
