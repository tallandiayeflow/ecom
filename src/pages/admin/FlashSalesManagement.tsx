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
  createFlashSale,
  deleteFlashSale,
  getFlashSalesAdmin,
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
        getFlashSalesAdmin(),
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
      {/* Header & Actions */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle>Gestion des Ventes Flash</CardTitle>
            <CardDescription>
              Créez des offres limitées dans le temps - {flashSales.length} vente(s) active(s)
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleOpenDialog()}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
            <Button
              variant="outline"
              onClick={loadInitialData}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loader */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : flashSales.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Aucune vente flash active
            </div>
          ) : (
            <>
              {/* Table pour desktop */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse border">
                    <thead className="bg-muted text-left">
                      <tr>
                        <th className="p-2">Produit</th>
                        <th className="p-2">Prix normal</th>
                        <th className="p-2">Prix flash</th>
                        <th className="p-2">Réduction</th>
                        <th className="p-2">Période</th>
                        <th className="p-2">Stock</th>
                        <th className="p-2">Statut</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flashSales.map((sale) => (
                        <tr key={sale.id} className="border-t">
                          <td className="p-2 flex items-center gap-2">
                            {sale.product?.images?.[0] && (
                              <img
                                src={sale.product.images[0]}
                                alt={sale.product.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                            )}
                            {sale.product.name}
                          </td>
                          <td className="p-2">{sale.product.price.toFixed(2)} Fcfa</td>
                          <td className="p-2 font-bold text-destructive">
                            {sale.discountPrice.toFixed(2)} Fcfa
                          </td>
                          <td className="p-2">
                            <Badge variant="destructive">-{sale.discountPercentage}%</Badge>
                          </td>
                          <td className="p-2 text-sm">
                            <p>{format(new Date(sale.startDate), 'dd/MM/yyyy HH:mm')}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(sale.endDate), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </td>
                          <td className="p-2">{sale.stock}</td>
                          <td className="p-2">
                            <Badge variant={sale.isActive ? 'default' : 'secondary'}>
                              {sale.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-2 text-right flex justify-end gap-2">
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
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleOpenDeleteDialog(sale)}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cards pour mobile */}
              <div className="md:hidden grid gap-4">
                {flashSales.map((sale) => (
                  <Card key={sale.id} className="border shadow-sm">
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        {sale.product?.images?.[0] && (
                          <img
                            src={sale.product.images[0]}
                            alt={sale.product.name}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{sale.product.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Prix: {sale.product.price.toFixed(2)} Fcfa</span>
                        <span className="font-bold text-destructive">{sale.discountPrice.toFixed(2)} Fcfa</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Stock: {sale.stock}</span>
                        <Badge variant={sale.isActive ? 'default' : 'secondary'}>
                          {sale.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(sale.startDate), 'dd/MM/yyyy HH:mm')} - {format(new Date(sale.endDate), 'dd/MM/yyyy HH:mm')}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
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
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleOpenDeleteDialog(sale)}
                          disabled={submitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout/édition */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSale ? 'Modifier la vente flash' : 'Ajouter une vente flash'}</DialogTitle>
            <DialogDescription>Configurez les détails de la vente flash</DialogDescription>
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
                      {product.name} - {product.price.toFixed(2)} Fcfa
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPrice">Prix promotionnel (Fcfa) *</Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                ) : editingSale ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
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
