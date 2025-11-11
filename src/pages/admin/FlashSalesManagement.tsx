import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { mockData } from '@/lib/mockData';
import type { FlashSale, Product } from '@/types';
import { format } from 'date-fns';

const FlashSalesManagement = () => {
  const [flashSales, setFlashSales] = useState<FlashSale[]>(mockData.flashSales);
  const [products] = useState<Product[]>(mockData.products);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    discountPrice: '',
    startDate: '',
    endDate: '',
    stock: '',
  });

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
        stock: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const product = products.find(p => p.id === formData.productId);
    if (!product) {
      toast.error('Produit introuvable');
      return;
    }

    const discountPrice = parseFloat(formData.discountPrice);
    const discountPercentage = Math.round(((product.price - discountPrice) / product.price) * 100);

    const newSale: FlashSale = {
      id: editingSale?.id || `flash-${Date.now()}`,
      productId: formData.productId,
      product,
      discountPrice,
      discountPercentage,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      stock: parseInt(formData.stock),
      isActive: new Date(formData.startDate) <= new Date() && new Date(formData.endDate) >= new Date(),
    };

    if (editingSale) {
      setFlashSales(flashSales.map(s => s.id === editingSale.id ? newSale : s));
      toast.success('Vente flash modifiée avec succès');
    } else {
      setFlashSales([...flashSales, newSale]);
      toast.success('Vente flash ajoutée avec succès');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setFlashSales(flashSales.filter(s => s.id !== id));
    toast.success('Vente flash supprimée avec succès');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Ventes Flash</h1>
          <p className="text-muted-foreground mt-1">
            Créez des offres limitées dans le temps
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une vente flash
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Prix normal</TableHead>
              <TableHead>Prix flash</TableHead>
              <TableHead>Réduction</TableHead>
              <TableHead>Début</TableHead>
              <TableHead>Fin</TableHead>
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
                    <img
                      src={sale.product.images[0]}
                      alt={sale.product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="font-medium">{sale.product.name}</div>
                  </div>
                </TableCell>
                <TableCell>{sale.product.price.toFixed(2)} DH</TableCell>
                <TableCell className="font-medium text-primary">
                  {sale.discountPrice.toFixed(2)} DH
                </TableCell>
                <TableCell>
                  <Badge variant="default">-{sale.discountPercentage}%</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(sale.startDate), 'dd/MM/yyyy HH:mm')}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(sale.endDate), 'dd/MM/yyyy HH:mm')}
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
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sale.id)}
                      className="text-destructive hover:text-destructive"
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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
              <Label htmlFor="product">Produit</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData({ ...formData, productId: value })}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPrice">Prix promotionnel (DH)</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  step="0.01"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock disponible</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingSale ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlashSalesManagement;
