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
  createBanner,
  deleteBanner,
  getBanners,
  getProducts
} from '@/lib/api';
import type { BannerSlide, Product } from '@/types';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const BannersManagement = () => {
  // États
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<BannerSlide | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    title: '',
    subtitle: '',
    displayOrder: 0,
  });

  // Charger les données au montage
  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger bannières et produits
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [bannersData, productsData] = await Promise.all([
        getBanners(),
        getProducts({ limit: 100 }) // Charger tous les produits
      ]);
      
      setBanners(bannersData);
      setProducts(productsData.products);
    } catch (error: any) {
      console.error('Erreur de chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dialog d'ajout/édition
  const handleOpenDialog = (banner?: BannerSlide) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        productId: banner.productId,
        title: banner.title,
        subtitle: banner.subtitle,
        displayOrder: banner.order,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        productId: '',
        title: '',
        subtitle: '',
        displayOrder: banners.length,
      });
    }
    setIsDialogOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.productId || !formData.title || !formData.subtitle) {
      toast.error('Veuillez remplir tous les champs');
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
        // Note: Le backend actuel ne supporte pas la mise à jour
        // On supprime et recrée la bannière
        await deleteBanner(editingBanner.id);
        await createBanner(bannerData);
        toast.success('Bannière modifiée avec succès ! ✅');
      } else {
        // Création
        await createBanner(bannerData);
        toast.success('Bannière ajoutée avec succès ! 🎉');
      }

      setIsDialogOpen(false);
      loadInitialData(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le dialog de confirmation de suppression
  const handleOpenDeleteDialog = (banner: BannerSlide) => {
    setDeletingBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  // Supprimer la bannière
  const handleDelete = async () => {
    if (!deletingBanner) return;

    try {
      setSubmitting(true);
      await deleteBanner(deletingBanner.id);
      toast.success('Bannière supprimée avec succès ! 🗑️');
      setIsDeleteDialogOpen(false);
      setDeletingBanner(null);
      loadInitialData(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Déplacer une bannière vers le haut
  const moveUp = async (index: number) => {
    if (index === 0) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
    
    // Mettre à jour localement
    setBanners(newBanners);
    
    // TODO: Implémenter un endpoint de mise à jour d'ordre dans le backend
    toast.info('Position modifiée (temporaire - rechargez pour voir l\'ordre d\'origine)');
  };

  // Déplacer une bannière vers le bas
  const moveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    
    // Mettre à jour localement
    setBanners(newBanners);
    
    // TODO: Implémenter un endpoint de mise à jour d'ordre dans le backend
    toast.info('Position modifiée (temporaire - rechargez pour voir l\'ordre d\'origine)');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Bannières</CardTitle>
          <CardDescription>
            Gérez le slider de la page d'accueil - {banners.length} bannière(s) active(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={() => handleOpenDialog()} 
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une bannière
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

          {/* Table des bannières */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Aucune bannière. Créez-en une pour commencer !
              </div>
            ) : (
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
                        {banner.product?.images?.[0] && (
                          <img
                            src={banner.product.images[0]}
                            alt={banner.title}
                            className="h-16 w-24 rounded object-cover"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {banner.subtitle}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{banner.product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {banner.product?.price.toFixed(2)} DH
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveUp(index)}
                            disabled={index === 0 || submitting}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveDown(index)}
                            disabled={index === banners.length - 1 || submitting}
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
                            disabled={submitting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDeleteDialog(banner)}
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
              {editingBanner ? 'Modifier la bannière' : 'Ajouter une bannière'}
            </DialogTitle>
            <DialogDescription>
              Configurez les détails de la bannière pour le slider
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Produit */}
            <div className="space-y-2">
              <Label htmlFor="product">Produit vedette *</Label>
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

            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Nouveau iPhone 15 Pro"
                required
                disabled={submitting}
              />
            </div>

            {/* Sous-titre */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre *</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="ex: Jusqu'à -30% de réduction"
                required
                disabled={submitting}
              />
            </div>

            {/* Ordre d'affichage */}
            <div className="space-y-2">
              <Label htmlFor="order">Ordre d'affichage</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Les bannières avec un ordre plus petit apparaissent en premier
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  editingBanner ? 'Modifier' : 'Ajouter'
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
              Cette action est irréversible. La bannière "{deletingBanner?.title}" sera définitivement supprimée.
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

export default BannersManagement;
