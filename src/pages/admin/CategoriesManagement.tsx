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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/lib/api";
import type { Category } from "@/types";
import { motion } from "framer-motion";
import { Layers, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    icon: "",
  });

  // Charger catégories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch {
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", icon: "" });
    }

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      setSubmitting(true);

      const categoryData = {
        name: formData.name.trim(),
        slug: "default-slug", // 🔥 valeur fixe
        icon: formData.icon.trim() || undefined,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast.success("Catégorie modifiée avec succès");
      } else {
        await createCategory(categoryData);
        toast.success("Catégorie ajoutée avec succès");
      }

      setIsDialogOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      setSubmitting(true);
      await deleteCategory(deletingCategory.id);
      toast.success("Catégorie supprimée");
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      loadCategories();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md border-border/60">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Gestion des Catégories
            </CardTitle>
            <CardDescription>
              {categories.length} catégorie(s) enregistrée(s)
            </CardDescription>
          </div>

          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Nouvelle Catégorie
            </Button>

            {/* Bouton Actualiser */}
            <Button
              variant="outline"
              onClick={loadCategories}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucune catégorie trouvée
              </div>
            ) : (
              <>
                {/* Vue Desktop */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Icône</TableHead>
                        <TableHead>Produits</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id} className="hover:bg-muted/40">
                          <TableCell className="font-semibold">
                            {cat.name}
                          </TableCell>

                          <TableCell className="text-lg">
                            {cat.icon || "📁"}
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary">
                              {cat.productCount || 0} produit(s)
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDialog(cat)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                disabled={(cat.productCount || 0) > 0}
                                onClick={() => handleOpenDeleteDialog(cat)}
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

                {/* Vue Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                  {categories.map((cat) => (
                    <motion.div
                      key={cat.id}
                      whileHover={{ scale: 1.02 }}
                      className="border rounded-lg p-4 shadow-sm bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-2xl">{cat.icon || "📁"}</span>
                        <Badge variant="outline">
                          {cat.productCount || 0} produit(s)
                        </Badge>
                      </div>

                      <h3 className="font-semibold text-lg">{cat.name}</h3>

                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleOpenDialog(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          disabled={(cat.productCount || 0) > 0}
                          onClick={() => handleOpenDeleteDialog(cat)}
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
        </CardContent>
      </Card>

      {/* Dialog Ajouter / Modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la Catégorie" : "Ajouter une Catégorie"}
            </DialogTitle>
            <DialogDescription>
              Définissez le nom et l’icône de la catégorie.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="ex: Smartphones"
              />
            </div>

            <div className="space-y-2">
              <Label>Icône (emoji)</Label>
              <Input
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="ex: 📱"
                maxLength={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Annuler
              </Button>

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : editingCategory ? (
                  "Modifier"
                ) : (
                  "Ajouter"
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous supprimer la catégorie{" "}
              <strong>{deletingCategory?.name}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={(deletingCategory?.productCount || 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>

        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesManagement;
