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
} from "@/lib/api";
import type { Category, Product } from "@/types";
import { motion } from "framer-motion";
import {
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      <Card className="shadow-sm border-border/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Gestion des Produits
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {totalProducts} produit(s) enregistré(s)
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Ajouter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadProducts}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barre de recherche + filtre */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="md:w-[220px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table ou liste responsive */}
          <div className="rounded-md border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucun produit trouvé
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow
                          key={product.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-10 w-10 rounded object-cover border"
                                />
                              )}
                              <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.brand}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {product.price.toLocaleString()} FCFA
                            </span>
                          </TableCell>
                          <TableCell>{product.stockQuantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.stockQuantity > 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {product.stockQuantity > 0
                                ? "En stock"
                                : "Rupture"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDialog(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  handleOpenDeleteDialog(product)
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile / tablette : cartes */}
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <motion.div
                      key={p.id}
                      className="border rounded-lg p-3 flex flex-col gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-36 w-full object-cover rounded"
                      />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <Badge
                          variant={
                            p.stockQuantity > 0 ? "default" : "destructive"
                          }
                        >
                          {p.stockQuantity > 0 ? "En stock" : "Rupture"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.brand}
                      </p>
                      <p className="font-bold text-primary text-sm">
                        {p.price.toLocaleString()} FCFA
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDeleteDialog(p)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-2 text-sm">
              <p className="text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

          

      {/* Dialog d'ajout/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du produit
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Nom */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="iPhone 15 Pro Max"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  disabled={submitting}
                  required
                >
                  <SelectTrigger>
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

              {/* Marque */}
              <div className="space-y-2">
                <Label htmlFor="brand">Marque</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Apple"
                  disabled={submitting}
                />
              </div>

              {/* Description */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description détaillée du produit..."
                  rows={3}
                  required
                  disabled={submitting}
                />
              </div>

              {/* Prix */}
              <div className="space-y-2">
                <Label htmlFor="price">Prix Promo (Fcfa) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="12999.99"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Prix original */}
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Prix original (Fcfa)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  placeholder="14999.99"
                  disabled={submitting}
                />
              </div>

              {/* Stock */}
              <div className="col-span-2 space-y-2">
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
                />
              </div>

                {/* Images - multiple URL inputs dynamiques */}
                <div className="col-span-2 space-y-2">
                <Label>Images (URLs) *</Label>
                {(() => {
                  const imagesArray = formData.images
                  ? formData.images.split(",").map((s) => s.trim())
                  : [""];
                  return (
                  <div className="space-y-2">
                    {imagesArray.map((img, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                      value={img}
                      onChange={(e) => {
                        const arr = [...imagesArray];
                        arr[idx] = e.target.value;
                        setFormData({
                        ...formData,
                        images: arr.join(", "),
                        });
                      }}
                      placeholder="https://example.com/image1.jpg"
                      disabled={submitting}
                      />
                      <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const arr = [...imagesArray];
                        arr.splice(idx, 1);
                        // ensure at least one input remains
                        const newArr = arr.length ? arr : [""];
                        setFormData({
                        ...formData,
                        images: newArr.join(", "),
                        });
                      }}
                      disabled={submitting}
                      aria-label={`Supprimer l'URL ${idx + 1}`}
                      >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {idx === imagesArray.length - 1 && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                        setFormData({
                          ...formData,
                          images: [...imagesArray, ""].join(", "),
                        })
                        }
                        disabled={submitting}
                        aria-label="Ajouter un autre URL"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      )}
                    </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                    Entrez une URL par champ. La première URL sera l'image principale. Les URLs seront concaténées et envoyées séparées par des virgules.
                    </p>
                  </div>
                  );
                })()}
                </div>
              

              {/* Spécifications *
              <div className="col-span-2 space-y-2">
                <Label htmlFor="specifications">Caractéristiques (JSON) *</Label>
                <Textarea
                  id="specifications"
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  rows={6}
                  placeholder='{"Écran": "6.7 pouces", "Processeur": "A17 Pro", "RAM": "8GB"}'
                  required
                  disabled={submitting}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Format JSON valide requis
                </p>
              </div> */}
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  editingProduct ? 'Modifier' : 'Ajouter'
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
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le produit "{deletingProduct?.name}" sera définitivement supprimé.
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
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductsManagement;
