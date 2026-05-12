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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  CategoryPayload,
} from "@/lib/api";
import type { Category } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Apple,
  Battery,
  Bluetooth,
  Box,
  Camera,
  Cpu,
  Folder,
  FolderOpen,
  Gamepad2,
  Headphones,
  Keyboard,
  Laptop,
  Layers,
  Lightbulb,
  Loader2,
  Monitor,
  Mouse,
  Package,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Router,
  Search,
  Smartphone,
  Speaker,
  Tablet,
  Trash2,
  Tv,
  Usb,
  Watch,
  Wifi,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// Collection d'icônes disponibles
const AVAILABLE_ICONS = [
  { name: "Smartphone", icon: Smartphone },
  { name: "Laptop", icon: Laptop },
  { name: "Tablet", icon: Tablet },
  { name: "Watch", icon: Watch },
  { name: "Headphones", icon: Headphones },
  { name: "Speaker", icon: Speaker },
  { name: "Camera", icon: Camera },
  { name: "Monitor", icon: Monitor },
  { name: "Tv", icon: Tv },
  { name: "Gamepad", icon: Gamepad2 },
  { name: "Keyboard", icon: Keyboard },
  { name: "Mouse", icon: Mouse },
  { name: "Printer", icon: Printer },
  { name: "Router", icon: Router },
  { name: "Wifi", icon: Wifi },
  { name: "Bluetooth", icon: Bluetooth },
  { name: "Battery", icon: Battery },
  { name: "Usb", icon: Usb },
  { name: "Cpu", icon: Cpu },
  { name: "Apple", icon: Apple },
  { name: "Box", icon: Box },
  { name: "Package", icon: Package },
  { name: "Folder", icon: Folder },
  { name: "FolderOpen", icon: FolderOpen },
  { name: "Layers", icon: Layers },
  { name: "Lightbulb", icon: Lightbulb },
];

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [iconSearchTerm, setIconSearchTerm] = useState("");
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    icon: "Folder",
    parentId: '',
  });

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
        icon: category.icon || "Folder",
        parentId: category.parentId || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", icon: "Folder", parentId: '' });
    }
    setIconSearchTerm("");
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

      const categoryData: CategoryPayload = {
        name: formData.name,
        icon: formData.icon,
        parent_id: formData.parentId || null,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast.success("Catégorie modifiée avec succès ! ✅");
      } else {
        await createCategory(categoryData);
        toast.success("Catégorie ajoutée avec succès ! 🎉");
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
      toast.success("Catégorie supprimée 🗑️");
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find((i) => i.name === iconName);
    return iconData?.icon || Folder;
  };

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Catégories</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Catégories actives</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec Produits</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {categories.filter((c) => (c.productCount || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Catégories utilisées</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Box className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Dans toutes catégories</p>
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
                  <Layers className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Catégories
              </CardTitle>
              <CardDescription className="text-sm">
                {categories.length} catégorie(s) • {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)} produit(s)
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => handleOpenDialog()}
                className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Catégorie
              </Button>
              <Button
                variant="outline"
                onClick={loadCategories}
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
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Layers className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune catégorie</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Commencez par créer votre première catégorie pour organiser vos produits
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une catégorie
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Icône</TableHead>
                        <TableHead className="font-semibold">Nom</TableHead>
                        <TableHead className="font-semibold">Produits</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories
                        .filter((c) => !c.parentId)
                        .map((rootCat, index) => {
                          const RootIconComponent = getIconComponent(rootCat.icon || "Folder");
                          const rootHasProducts = (rootCat.productCount || 0) > 0;

                          return (
                            <React.Fragment key={rootCat.id}>
                              <motion.tr
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group hover:bg-accent/50 transition-all duration-200 border-b"
                              >
                                <TableCell>
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-2 ring-border transition-all duration-300 group-hover:ring-primary group-hover:scale-110">
                                    <RootIconComponent className="h-6 w-6 text-primary" />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="font-semibold group-hover:text-primary transition-colors">
                                    {rootCat.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Slug: {rootCat.slug}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={rootHasProducts ? "default" : "secondary"}
                                    className={
                                      rootHasProducts
                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                        : ""
                                    }
                                  >
                                    {rootCat.productCount || 0} produit(s)
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleOpenDialog(rootCat)}
                                      className="h-9 w-9 transition-all duration-300 hover:scale-110 hover:bg-primary/10 hover:text-primary"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleOpenDeleteDialog(rootCat)}
                                      disabled={rootHasProducts}
                                      className="h-9 w-9 text-destructive transition-all duration-300 hover:scale-110 hover:bg-destructive/10 disabled:opacity-50"
                                      title={
                                        rootHasProducts
                                          ? "Impossible de supprimer (contient des produits)"
                                          : "Supprimer la catégorie"
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </motion.tr>
                              {(rootCat.subcategories ?? []).map((sub, subIndex) => {
                                const SubIconComponent = getIconComponent(sub.icon || "Folder");
                                const subHasProducts = (sub.productCount || 0) > 0;

                                return (
                                  <motion.tr
                                    key={sub.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (index * 0.05) + (subIndex * 0.03) }}
                                    className="group hover:bg-accent/50 transition-all duration-200 border-b bg-muted/30"
                                  >
                                    <TableCell>
                                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-2 ring-border transition-all duration-300 group-hover:ring-primary group-hover:scale-110">
                                        <SubIconComponent className="h-6 w-6 text-primary" />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <p className="font-semibold group-hover:text-primary transition-colors">
                                        <span className="text-muted-foreground mr-1">↳</span>
                                        {sub.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Slug: {sub.slug}
                                      </p>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={subHasProducts ? "default" : "secondary"}
                                        className={
                                          subHasProducts
                                            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                            : ""
                                        }
                                      >
                                        {sub.productCount || 0} produit(s)
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleOpenDialog(sub)}
                                          className="h-9 w-9 transition-all duration-300 hover:scale-110 hover:bg-primary/10 hover:text-primary"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleOpenDeleteDialog(sub)}
                                          disabled={subHasProducts}
                                          className="h-9 w-9 text-destructive transition-all duration-300 hover:scale-110 hover:bg-destructive/10 disabled:opacity-50"
                                          title={
                                            subHasProducts
                                              ? "Impossible de supprimer (contient des produits)"
                                              : "Supprimer la catégorie"
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </motion.tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((cat, index) => {
                    const IconComponent = getIconComponent(cat.icon || "Folder");
                    const hasProducts = (cat.productCount || 0) > 0;

                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-primary/20">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center ring-2 ring-border">
                                <IconComponent className="h-7 w-7 text-primary" />
                              </div>
                              <Badge
                                variant={hasProducts ? "default" : "secondary"}
                                className={
                                  hasProducts
                                    ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    : ""
                                }
                              >
                                {cat.productCount || 0}
                              </Badge>
                            </div>

                            <div>
                              <h3 className="font-semibold text-lg">{cat.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {cat.slug}
                              </p>
                            </div>

                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDialog(cat)}
                                className="flex-1 transition-all duration-300 hover:scale-105"
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDeleteDialog(cat)}
                                disabled={hasProducts}
                                className="flex-1 text-destructive hover:bg-destructive/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ajouter / Modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {editingCategory ? (
                <>
                  <Pencil className="h-5 w-5 text-primary" />
                  Modifier la Catégorie
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-primary" />
                  Ajouter une Catégorie
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Définissez le nom et sélectionnez une icône pour la catégorie.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la catégorie *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ex: Smartphones, Tablettes..."
                className="h-11"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Icône *</Label>
              <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full h-14 justify-start text-left font-normal"
                    disabled={submitting}
                  >
                    {(() => {
                      const IconComponent = getIconComponent(formData.icon);
                      return (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-primary" />
                          </div>
                          <span>{formData.icon}</span>
                        </div>
                      );
                    })()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher une icône..."
                        value={iconSearchTerm}
                        onChange={(e) => setIconSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                      />
                      {iconSearchTerm && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setIconSearchTerm("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-[320px]">
                    <div className="grid grid-cols-4 gap-2 p-3">
                      {filteredIcons.length > 0 ? (
                        filteredIcons.map((iconData) => {
                          const IconComponent = iconData.icon;
                          const isSelected = formData.icon === iconData.name;

                          return (
                            <button
                              key={iconData.name}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, icon: iconData.name });
                                setIconPopoverOpen(false);
                                setIconSearchTerm("");
                              }}
                              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-md ${isSelected
                                  ? "border-primary bg-primary/10"
                                  : "border-transparent hover:border-primary/50 hover:bg-accent"
                                }`}
                              title={iconData.name}
                            >
                              <IconComponent
                                className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"
                                  }`}
                              />
                              <span
                                className={`text-[10px] font-medium truncate w-full text-center ${isSelected ? "text-primary" : "text-muted-foreground"
                                  }`}
                              >
                                {iconData.name}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-4 flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mb-2" />
                          <p className="text-sm">Aucune icône trouvée</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground">
                    {filteredIcons.length} icône(s) disponible(s)
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Sélectionnez une icône pour représenter cette catégorie
              </p>
            </div>

                <div className="space-y-2">
                  <Label>Catégorie parente (optionnel)</Label>
                  <Select
                    value={formData.parentId || 'none'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, parentId: v === 'none' ? '' : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune (catégorie racine)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune (catégorie racine)</SelectItem>
                      {categories
                        .filter((c) => !c.parentId && c.id !== editingCategory?.id)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                    {editingCategory ? "Modification..." : "Ajout..."}
                  </>
                ) : (
                  <>
                    {editingCategory ? (
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

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Voulez-vous supprimer la catégorie{" "}
                <span className="font-semibold text-foreground">"{deletingCategory?.name}"</span> ?
              </p>
              {(deletingCategory?.productCount || 0) > 0 && (
                <p className="text-destructive font-medium">
                  ⚠️ Cette catégorie contient {deletingCategory?.productCount} produit(s) et ne peut pas être supprimée.
                </p>
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
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesManagement;
