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
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { mockData } from '@/lib/mockData';
import type { BannerSlide, Product } from '@/types';

const BannersManagement = () => {
  const [banners, setBanners] = useState<BannerSlide[]>(
    mockData.banners.sort((a, b) => a.order - b.order)
  );
  const [products] = useState<Product[]>(mockData.products);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    title: '',
    subtitle: '',
    imageUrl: '',
  });

  const handleOpenDialog = (banner?: BannerSlide) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        productId: banner.productId,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        productId: '',
        title: '',
        subtitle: '',
        imageUrl: '',
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

    const newBanner: BannerSlide = {
      id: editingBanner?.id || `banner-${Date.now()}`,
      productId: formData.productId,
      product,
      title: formData.title,
      subtitle: formData.subtitle,
      imageUrl: formData.imageUrl,
      order: editingBanner?.order || banners.length,
      isActive: true,
    };

    if (editingBanner) {
      setBanners(banners.map(b => b.id === editingBanner.id ? newBanner : b));
      toast.success('Bannière modifiée avec succès');
    } else {
      setBanners([...banners, newBanner]);
      toast.success('Bannière ajoutée avec succès');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
    toast.success('Bannière supprimée avec succès');
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
    setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
  };

  const moveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Bannières</h1>
          <p className="text-muted-foreground mt-1">
            Gérez le slider de la page d'accueil
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une bannière
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aperçu</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Sous-titre</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Ordre</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner, index) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-16 w-24 rounded object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{banner.title}</TableCell>
                <TableCell className="text-muted-foreground">{banner.subtitle}</TableCell>
                <TableCell>{banner.product.name}</TableCell>
                <TableCell>
                  <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveDown(index)}
                      disabled={index === banners.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(banner)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(banner.id)}
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
              {editingBanner ? 'Modifier la bannière' : 'Ajouter une bannière'}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la bannière
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Produit vedette</Label>
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
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Nouveau iPhone 15 Pro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="ex: Jusqu'à -30% de réduction"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de l'image</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingBanner ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannersManagement;
