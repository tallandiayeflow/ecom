import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct
} from '@/lib/api';
import type { Category, Product } from '@/types';
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const ProductsManagement = () => {
  // États
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    images: '',
    stockQuantity: '',
    brand: '',
    specifications: '{}',
  });

  // Charger les données au montage
  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger les produits quand les filtres changent
  useEffect(() => {
    loadProducts();
  }, [searchTerm, selectedCategory, currentPage]);

  // Charger catégories et produits
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData] = await Promise.all([
        getCategories(),
      ]);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Erreur de chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits avec filtres
  const loadProducts = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
      };

      const data = await getProducts(filters);
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotalProducts(data.total);
    } catch (error: any) {
      console.error('Erreur de chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  // Filtres locaux pour l'affichage immédiat
  const filteredProducts = products;

  // Ouvrir le dialog d'ajout/édition
  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      
      // Récupérer le slug de la catégorie
      const categorySlug = product.category;
      
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        originalPrice: product.originalPrice?.toString() || '',
        category: categorySlug,
        images: product.images.join(', '),
        stockQuantity: product.stockQuantity.toString(),
        brand: product.brand || '',
        specifications: JSON.stringify(product.specifications, null, 2),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: '',
        images: '',
        stockQuantity: '',
        brand: '',
        specifications: '{}',
      });
    }
    setIsDialogOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.stockQuantity) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSubmitting(true);
      
      // Parser les spécifications JSON
      let specifications = {};
      try {
        specifications = JSON.parse(formData.specifications);
      } catch (e) {
        toast.error('Format JSON invalide pour les spécifications');
        return;
      }

      // Préparer les données pour l'API
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        category: formData.category,
        images: formData.images.split(',').map(img => img.trim()).filter(img => img),
        image: formData.images.split(',')[0]?.trim() || '',
        stock: parseInt(formData.stockQuantity),
        brand: formData.brand.trim() || undefined,
        specifications,
        isFeatured: editingProduct?.featured || false,
      };

      if (editingProduct) {
        // Mise à jour
        await updateProduct(editingProduct.id, productData);
        toast.success('Produit modifié avec succès ! ✅');
      } else {
        // Création
        await createProduct(productData);
        toast.success('Produit ajouté avec succès ! 🎉');
      }

      setIsDialogOpen(false);
      loadProducts(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la sauvegarde du produit';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le dialog de confirmation de suppression
  const handleOpenDeleteDialog = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Supprimer le produit
  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      setSubmitting(true);
      await deleteProduct(deletingProduct.id);
      toast.success('Produit supprimé avec succès ! 🗑️');
      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      loadProducts(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Produits</CardTitle>
          <CardDescription>
            Gérez tous vos produits - {totalProducts} produit(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions et filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => handleOpenDialog()} 
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>

            <Button
              variant="outline"
              onClick={loadProducts}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                disabled={loading}
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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

          {/* Table des produits */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Aucun produit trouvé
              </div>
            ) : (
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
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.slug === product.category);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.brand}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{category?.name || product.category}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.price.toFixed(2)} DH</p>
                            {product.originalPrice && (
                              <p className="text-sm text-muted-foreground line-through">
                                {product.originalPrice.toFixed(2)} DH
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.stockQuantity}</TableCell>
                        <TableCell>
                          <Badge variant={product.inStock ? 'default' : 'destructive'}>
                            {product.inStock ? 'En stock' : 'Rupture'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(product)}
                              disabled={submitting}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(product)}
                              className="text-destructive hover:text-destructive"
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
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
                <Label htmlFor="price">Prix (DH) *</Label>
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
                <Label htmlFor="originalPrice">Prix original (DH)</Label>
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

              {/* Images */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="images">Images (URLs séparées par des virgules) *</Label>
                <Textarea
                  id="images"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  rows={2}
                  required
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  La première URL sera l'image principale
                </p>
              </div>

              {/* Spécifications */}
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
