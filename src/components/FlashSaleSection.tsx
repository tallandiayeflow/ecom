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
import {
  createFlashSale,
  deleteFlashSale,
  getFlashSales,
  getProducts
} from '@/lib/api';
import type { FlashSale, Product } from '@/types';
import { format } from 'date-fns';
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const FlashSalesManagement = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [deletingSale, setDeletingSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    productId: '',
    discountPrice: '',
    startDate: '',
    endDate: '',
    stock: '100',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [salesData, productsData] = await Promise.all([
        getFlashSales(),
        getProducts({ limit: 100 })
      ]);
      setFlashSales(salesData);
      setProducts(productsData.products);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
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
        productId: '',
        discountPrice: '',
        startDate: '',
        endDate: '',
        stock: '100',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId || !formData.discountPrice) {
      toast.error('Veuillez remplir tous les champs requis');
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
        // Pour éditer: supprimer puis recréer
        await deleteFlashSale(editingSale.id);
        await createFlashSale(saleData);
        toast.success('Vente flash modifiée avec succès ! ✅');
      } else {
        await createFlashSale(saleData);
        toast.success('Vente flash ajoutée avec succès ! 🎉');
      }

      setIsDialogOpen(false);
      loadInitialData();
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la sauvegarde';
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
      toast.success('Vente flash supprimée avec succès ! 🗑️');
      setIsDeleteDialogOpen(false);
      setDeletingSale(null);
      loadInitialData();
    } catch (error: any) {
      console.error('Error:', error);
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
          <CardTitle>Gestion des Ventes Flash</CardTitle>
          <CardDescription>
            Créez des offres limitées dans le temps - {flashSales.length} vente(s) active(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => handleOpenDialog()}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une vente flash
            </Button>

            <Button
              variant="outline"
              onClick={loadInitialData}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : flashSales.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Aucune vente flash active
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Prix normal</TableHead>
                    <TableHead>Prix flash</TableHead>
                    <TableHead>Réduction</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flashSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {sale.product?.images?.[0] && (
                            <img
                              src={sale.product.images[0]}
                              alt={sale.product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <span className="font-medium">{sale.product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sale.product.price.toFixed(2)} DH</TableCell>
                      <TableCell className="font-bold text-destructive">
                        {sale.discountPrice.toFixed(2)} DH
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">-{sale.discountPercentage}%</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(new Date(sale.startDate), 'dd/MM/yyyy HH:mm')}</p>
                          <p className="text-muted-foreground">
                            {format(new Date(sale.endDate), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{sale.stock}</TableCell>
                      <TableCell>
                        <Badge variant={sale.isActive ? 'default' : 'secondary'}>
                          {sale.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(sale)}
                            disabled={submitting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDeleteDialog(sale)}
                            className="text-destructive hover:text-destructive"
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog d'ajout/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSale ? 'Modifier la vente flash' : 'Ajouter une vente flash'}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la vente flash
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produit *</Label>
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
                      {product.name} - {product.price.toFixed(2)} DH
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice">Prix promotionnel (DH) *</Label>
              <Input
                id="discountPrice"
                type="number"
                step="0.01"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                placeholder="9999.99"
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock disponible</Label>
              <Input
                id="stock"
                type="number"
                min="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début *</Label>
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
                <Label htmlFor="endDate">Date de fin *</Label>
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
                  editingSale ? 'Modifier' : 'Ajouter'
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
              Cette action est irréversible. La vente flash pour "{deletingSale?.product.name}" sera définitivement supprimée.
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

export default FlashSalesManagement;
