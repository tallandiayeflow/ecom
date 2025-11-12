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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory
} from '@/lib/api';
import type { Category } from '@/types';
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const CategoriesManagement = () => {
  // États
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
  });

  // Charger les catégories au montage
  useEffect(() => {
    loadCategories();
  }, []);

  // Charger les catégories depuis l'API
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Erreur de chargement:', error);
      toast.error('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  // Générer automatiquement le slug à partir du nom
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par -
      .replace(/^-+|-+$/g, ''); // Enlever les - au début et à la fin
  };

  // Ouvrir le dialog d'ajout/édition
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        icon: category.icon || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        icon: '',
      });
    }
    setIsDialogOpen(true);
  };

  // Mettre à jour le slug automatiquement quand le nom change
  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      // Générer le slug seulement si on est en mode création
      slug: editingCategory ? formData.slug : generateSlug(name),
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      setSubmitting(true);
      
      // Générer le slug si vide
      const slug = formData.slug || generateSlug(formData.name);
      
      const categoryData = {
        name: formData.name.trim(),
        slug,
        icon: formData.icon.trim() || undefined,
      };

      if (editingCategory) {
        // Mise à jour
        await updateCategory(editingCategory.id, categoryData);
        toast.success('Catégorie modifiée avec succès ! ✅');
      } else {
        // Création
        await createCategory(categoryData);
        toast.success('Catégorie ajoutée avec succès ! 🎉');
      }

      setIsDialogOpen(false);
      loadCategories(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir le dialog de confirmation de suppression
  const handleOpenDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Supprimer la catégorie
  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      setSubmitting(true);
      await deleteCategory(deletingCategory.id);
      toast.success('Catégorie supprimée avec succès ! 🗑️');
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      loadCategories(); // Recharger la liste
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
          <CardTitle>Gestion des Catégories</CardTitle>
          <CardDescription>
            Organisez vos produits par catégories - {categories.length} catégorie(s) au total
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
              Ajouter une catégorie
            </Button>

            <Button
              variant="outline"
              onClick={loadCategories}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Table des catégories */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Aucune catégorie trouvée. Créez-en une pour commencer !
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Icône</TableHead>
                    <TableHead>Nombre de produits</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {category.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {category.productCount || 0} produit(s)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(category)}
                            disabled={submitting}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDeleteDialog(category)}
                            className="text-destructive hover:text-destructive"
                            disabled={submitting || (category.productCount || 0) > 0}
                            title={
                              (category.productCount || 0) > 0
                                ? 'Impossible de supprimer une catégorie contenant des produits'
                                : 'Supprimer la catégorie'
                            }
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
              {editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}
            </DialogTitle>
            <DialogDescription>
              Définissez les informations de la catégorie
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ex: Smartphones"
                required
                disabled={submitting}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="ex: smartphones (généré automatiquement)"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Utilisé dans l'URL. Sera généré automatiquement si laissé vide.
              </p>
            </div>

            {/* Icône */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icône (emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="ex: 📱"
                maxLength={2}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Un emoji pour représenter la catégorie
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
                  editingCategory ? 'Modifier' : 'Ajouter'
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
              Cette action est irréversible. La catégorie "{deletingCategory?.name}" sera définitivement supprimée.
              {(deletingCategory?.productCount || 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Cette catégorie contient {deletingCategory?.productCount} produit(s). 
                  Supprimez d'abord les produits associés.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting || (deletingCategory?.productCount || 0) > 0}
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

export default CategoriesManagement;
