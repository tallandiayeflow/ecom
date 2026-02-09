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
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
  uploadProductImage,
  getImageUrl,
} from "@/lib/api";
import type { Category, Product } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
  Filter,
  ImageIcon,
  Loader2,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "",
    images: "",
    stockQuantity: "",
    brand: "",
    specifications: "{}",
    colors: '',
    sizes: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([getCategories()]);
      setCategories(categoriesData);
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
      };
      const data = await getProducts(filters);
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.total);
    } catch {
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || "",
        category: product.category,
        images: product.images.join(", "),
        stockQuantity: product.stockQuantity.toString(),
        brand: product.brand || "",
        specifications: JSON.stringify(product.specifications, null, 2),
        colors: (product.colors ?? []).join(', '),
        sizes: (product.sizes ?? []).join(', '),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "",
        images: "",
        stockQuantity: "",
        brand: "",
        specifications: "{}",
        colors: "",
        sizes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSubmitting(true);
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        category: formData.category,
        images: formData.images
          .split(",")
          .map((img) => img.trim())
          .filter((img) => img),
        image: formData.images.split(",")[0]?.trim() || "",
        stock: parseInt(formData.stockQuantity),
        brand: formData.brand.trim() || undefined,
        specifications: JSON.parse(formData.specifications),
        colors: formData.colors
          ? formData.colors.split(",").map((c) => c.trim()).filter(Boolean)
          : undefined,
        sizes: formData.sizes
          ? formData.sizes.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success("Produit modifié avec succès ! ✅");
      } else {
        await createProduct(productData);
        toast.success("Produit ajouté avec succès ! 🎉");
      }
      setIsDialogOpen(false);
      loadProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur de sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File, idx: number) => {
    try {
      setUploadingIdx(idx);
      const data = await uploadProductImage(file);

      const imagesArray = formData.images
        ? formData.images.split(",").map((s) => s.trim())
        : [""];

      imagesArray[idx] = data.url;
      setFormData({ ...formData, images: imagesArray.join(", ") });
      toast.success("Image uploadée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      setSubmitting(true);
      await deleteProduct(deletingProduct.id);
      toast.success("Produit supprimé avec succès 🗑️");
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      loadProducts();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Rupture</Badge>;
    }
    if (quantity < 10) {
      return <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"><AlertCircle className="h-3 w-3" />Stock faible</Badge>;
    }
    return <Badge variant="default" className="gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/20"><Package className="h-3 w-3" />En stock</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Produits enregistrés</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Stock</CardTitle>
            <PackageOpen className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {products.some(p => p.stockQuantity > 0) ? "Actif" : "À vérifier"}
            </div>
            <p className="text-xs text-muted-foreground">Disponibilité stock</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <Tag className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {categories.length}
            </div>
            <p className="text-xs text-muted-foreground">Catégories actives</p>
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
                  <Package className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Produits
              </CardTitle>
              <CardDescription className="text-sm">
                {totalProducts} produit(s) • {products.filter(p => p.stockQuantity > 0).length} disponible(s)
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleOpenDialog()}
                className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un produit
              </Button>
              <Button
                variant="outline"
                onClick={loadProducts}
                disabled={loading}
                className="transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, marque ou catégorie..."
                className="pl-10 h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="lg:w-[280px] h-11 transition-all duration-300 hover:border-primary/50">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrer par catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-medium">Toutes les catégories</span>
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchTerm || selectedCategory !== "all"
                    ? "Essayez de modifier vos critères de recherche"
                    : "Commencez par ajouter votre premier produit"}
                </p>
                {!searchTerm && selectedCategory === "all" && (
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un produit
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Produit</TableHead>
                        <TableHead className="font-semibold">Catégorie</TableHead>
                        <TableHead className="font-semibold">Prix</TableHead>
                        <TableHead className="font-semibold text-center">Stock</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product, index) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted ring-2 ring-border transition-all duration-300 group-hover:ring-primary group-hover:scale-110">
                                {product.images[0] ? (
                                  <img
                                    src={getImageUrl(product.images[0])}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold truncate group-hover:text-primary transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.brand || "Sans marque"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span className="font-bold text-primary">
                                {product.price.toLocaleString()} FCFA
                              </span>
                              {product.originalPrice && (
                                <p className="text-xs text-muted-foreground line-through">
                                  {product.originalPrice.toLocaleString()} FCFA
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono font-semibold">
                              {product.stockQuantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStockBadge(product.stockQuantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDialog(product)}
                                className="h-9 w-9 transition-all duration-300 hover:scale-110 hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDeleteDialog(product)}
                                className="h-9 w-9 text-destructive transition-all duration-300 hover:scale-110 hover:bg-destructive/10"
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
                  {products.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-primary/20">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted ring-2 ring-border flex-shrink-0">
                              {product.images[0] ? (
                                <img
                                  src={getImageUrl(product.images[0])}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              <div>
                                <h3 className="font-semibold truncate">{product.name}</h3>
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.brand || "Sans marque"}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {product.category}
                                </Badge>
                                {getStockBadge(product.stockQuantity)}
                              </div>

                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg text-primary">
                                  {product.price.toLocaleString()} FCFA
                                </span>
                                {product.originalPrice && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {product.originalPrice.toLocaleString()} FCFA
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 p-3 border-t bg-muted/30">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDialog(product)}
                              className="flex-1 transition-all duration-300 hover:scale-105"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDeleteDialog(product)}
                              className="flex-1 text-destructive hover:bg-destructive/10 transition-all duration-300 hover:scale-105"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{currentPage}</span> sur{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="transition-all duration-300 hover:scale-105"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-9 w-9 p-0 transition-all duration-300 hover:scale-110"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="transition-all duration-300 hover:scale-105"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {editingProduct ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Modifier le produit
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Ajouter un produit
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du produit. Les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Package className="h-4 w-4" />
                Informations de base
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro Max 256GB"
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    disabled={submitting}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ex: Apple, Samsung..."
                    disabled={submitting}
                    className="h-11"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée du produit..."
                    rows={4}
                    required
                    disabled={submitting}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Prix et Stock */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Prix et Stock
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix de vente (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="450000"
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Prix original (FCFA)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    placeholder="500000"
                    disabled={submitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Pour afficher une réduction</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Quantité en stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="50"
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Variantes */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Variantes (optionnel)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colors">Couleurs</Label>
                  <Input
                    id="colors"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    placeholder="Ex: noir, blanc, bleu"
                    disabled={submitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sépare par des virgules. Laisse vide si non applicable.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sizes">Tailles</Label>
                  <Input
                    id="sizes"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                    placeholder="Ex: S, M, L (ou 64Go, 128Go)"
                    disabled={submitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sépare par des virgules. Laisse vide si non applicable.
                  </p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Images du produit
              </h3>

              <div className="space-y-3">
                {(() => {
                  const imagesArray = formData.images
                    ? formData.images.split(",").map((s) => s.trim())
                    : [""];

                  return (
                    <>
                      {imagesArray.map((img, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center gap-2"
                        >
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground sm:w-20">
                              Image {idx + 1}
                            </span>

                            <div className="flex-1 flex gap-2">
                              <Input
                                value={img}
                                onChange={(e) => {
                                  const arr = [...imagesArray];
                                  arr[idx] = e.target.value;
                                  setFormData({ ...formData, images: arr.join(", ") });
                                }}
                                placeholder="URL de l'image ou upload"
                                disabled={submitting || uploadingIdx === idx}
                                className="h-11"
                              />
                              <div className="relative">
                                <input
                                  type="file"
                                  id={`upload-${idx}`}
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(file, idx);
                                  }}
                                  disabled={submitting || uploadingIdx === idx}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-11"
                                  onClick={() => document.getElementById(`upload-${idx}`)?.click()}
                                  disabled={submitting || uploadingIdx === idx}
                                >
                                  {uploadingIdx === idx ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1 justify-end">
                            {imagesArray.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const arr = [...imagesArray];
                                  arr.splice(idx, 1);
                                  setFormData({ ...formData, images: arr.join(", ") });
                                }}
                                disabled={submitting || uploadingIdx !== null}
                                className="h-11 w-11 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}

                            {idx === imagesArray.length - 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    images: [...imagesArray, ""].join(", "),
                                  })
                                }
                                disabled={submitting || uploadingIdx !== null}
                                className="h-11 w-11"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Eye className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        La première image sera utilisée comme image principale du produit.
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <DialogFooter className="gap-2">
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
                    {editingProduct ? "Modification..." : "Ajout..."}
                  </>
                ) : (
                  <>
                    {editingProduct ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifier
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Êtes-vous sûr de vouloir supprimer le produit{" "}
                <span className="font-semibold text-foreground">"{deletingProduct?.name}"</span> ?
              </p>
              <p className="text-destructive">
                Cette action est irréversible et supprimera définitivement ce produit.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsManagement;
