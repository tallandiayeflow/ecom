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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  CategoryPayload,
} from "@/lib/api";
import type { Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Apple,
  Battery,
  Bluetooth,
  Box,
  Camera,
  ChevronRight,
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

type DialogMode = "category" | "subcategory";

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Selection
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("category");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "Folder", parentId: "" });
  const [iconSearch, setIconSearch] = useState("");
  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);

  // Delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  useEffect(() => { loadCategories(); }, []);

  // Auto-select first parent on load
  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      const first = categories.find(c => !c.parentId);
      if (first) setSelectedCatId(first.id);
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch {
      toast.error("Erreur chargement catégories");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ─────────────────────────────────────────────
  const parentCats = categories.filter(c => !c.parentId);
  const selectedCat = parentCats.find(c => c.id === selectedCatId) ?? null;
  const selectedSubs = selectedCat?.subcategories ?? [];
  const totalSubcategories = categories.reduce((sum, c) => sum + (c.subcategories?.length ?? 0), 0);
  const totalProducts = categories.reduce(
    (sum, c) => sum + (c.productCount || 0) + (c.subcategories ?? []).reduce((s, sub) => s + (sub.productCount || 0), 0), 0
  );

  // ── Dialog helpers ────────────────────────────────────────────
  const openNewCategory = () => {
    setEditingCategory(null);
    setDialogMode("category");
    setFormData({ name: "", icon: "Folder", parentId: "" });
    setIconSearch("");
    setIsDialogOpen(true);
  };

  const openNewSubcategory = () => {
    if (!selectedCatId) { toast.error("Sélectionne d'abord une catégorie"); return; }
    setEditingCategory(null);
    setDialogMode("subcategory");
    setFormData({ name: "", icon: "Folder", parentId: selectedCatId });
    setIconSearch("");
    setIsDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setDialogMode(cat.parentId ? "subcategory" : "category");
    setFormData({ name: cat.name, icon: cat.icon ?? "Folder", parentId: cat.parentId ?? "" });
    setIconSearch("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Le nom est requis"); return; }
    try {
      setSubmitting(true);
      const payload: CategoryPayload = {
        name: formData.name.trim(),
        icon: formData.icon,
        parent_id: formData.parentId || null,
      };
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success("Catégorie modifiée ✅");
      } else {
        await createCategory(payload);
        toast.success(dialogMode === "subcategory" ? "Sous-catégorie créée 🎉" : "Catégorie créée 🎉");
      }
      setIsDialogOpen(false);
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erreur d'enregistrement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setSubmitting(true);
      await deleteCategory(deletingCategory.id);
      toast.success("Supprimé 🗑️");
      setIsDeleteDialogOpen(false);
      if (deletingCategory.id === selectedCatId) setSelectedCatId(null);
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erreur suppression");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (name: string) => AVAILABLE_ICONS.find(i => i.name === name)?.icon ?? Folder;
  const filteredIcons = AVAILABLE_ICONS.filter(i => i.name.toLowerCase().includes(iconSearch.toLowerCase()));

  // ── Icon picker (shared) ──────────────────────────────────────
  const IconPicker = () => (
    <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 justify-start gap-3 font-normal"
          disabled={submitting}
        >
          {(() => { const I = getIcon(formData.icon); return <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><I className="h-5 w-5 text-primary" /></div>; })()}
          <span>{formData.icon}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={iconSearch}
              onChange={e => setIconSearch(e.target.value)}
              className="pl-9 h-9"
            />
            {iconSearch && (
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setIconSearch("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-4 gap-2 p-3">
            {filteredIcons.map(({ name, icon: I }) => {
              const sel = formData.icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { setFormData(f => ({ ...f, icon: name })); setIconPopoverOpen(false); setIconSearch(""); }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all hover:scale-105 ${sel ? "border-primary bg-primary/10" : "border-transparent hover:border-primary/40 hover:bg-accent"}`}
                >
                  <I className={`h-5 w-5 ${sel ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[9px] truncate w-full text-center ${sel ? "text-primary" : "text-muted-foreground"}`}>{name}</span>
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-4 py-8 text-center text-muted-foreground text-sm">Aucune icône trouvée</div>
            )}
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground text-center py-2 border-t">{filteredIcons.length} icône(s)</p>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">

      {/* ── STATS ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Catégories</p>
            <p className="text-3xl font-bold">{parentCats.length}</p>
          </CardContent>
        </Card>
        <Card className="border-violet-500/20">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Sous-catégories</p>
            <p className="text-3xl font-bold text-violet-600">{totalSubcategories}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total produits</p>
            <p className="text-3xl font-bold text-green-600">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Niveaux</p>
            <p className="text-3xl font-bold text-orange-600">2</p>
          </CardContent>
        </Card>
      </div>

      {/* ── SPLIT VIEW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5">

        {/* ── LEFT : Categories ── */}
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                Catégories
                <Badge variant="secondary" className="ml-1">{parentCats.length}</Badge>
              </CardTitle>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadCategories} disabled={loading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button size="sm" className="gap-1.5 h-8" onClick={openNewCategory}>
                  <Plus className="h-3.5 w-3.5" />
                  Nouvelle
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : parentCats.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucune catégorie</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={openNewCategory}>
                  <Plus className="h-3.5 w-3.5" />Créer la première
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {parentCats.map((cat, idx) => {
                  const Icon = getIcon(cat.icon ?? "Folder");
                  const isSelected = selectedCatId === cat.id;
                  const subCount = cat.subcategories?.length ?? 0;
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all group ${
                        isSelected
                          ? "bg-primary/8 border-l-2 border-primary"
                          : "hover:bg-muted/50 border-l-2 border-transparent"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isSelected ? "text-primary" : ""}`}>{cat.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{cat.productCount ?? 0} produit(s)</span>
                          {subCount > 0 && (
                            <span className="text-xs text-violet-600 font-medium">· {subCount} sous-cat.</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                          onClick={e => { e.stopPropagation(); openEdit(cat); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                          onClick={e => { e.stopPropagation(); setDeletingCategory(cat); setIsDeleteDialogOpen(true); }}
                          disabled={(cat.productCount ?? 0) > 0 || subCount > 0}
                          title={(cat.productCount ?? 0) > 0 || subCount > 0 ? "Contient des produits ou sous-catégories" : "Supprimer"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {isSelected && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── RIGHT : Subcategories ── */}
        <Card className="border-violet-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-violet-600" />
                </div>
                Sous-catégories
                {selectedCat && (
                  <span className="text-muted-foreground font-normal text-sm">
                    — <span className="text-foreground font-semibold">{selectedCat.name}</span>
                  </span>
                )}
                {selectedSubs.length > 0 && (
                  <Badge variant="secondary" className="bg-violet-500/10 text-violet-600">{selectedSubs.length}</Badge>
                )}
              </CardTitle>
              {selectedCat && (
                <Button size="sm" variant="outline" className="gap-1.5 h-8 border-violet-500/30 text-violet-700 hover:bg-violet-500/10" onClick={openNewSubcategory}>
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {!selectedCat ? (
              <div className="py-16 text-center text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <ChevronRight className="h-8 w-8 opacity-30" />
                </div>
                <p className="text-sm font-medium">Sélectionne une catégorie</p>
                <p className="text-xs mt-1">Les sous-catégories apparaîtront ici</p>
              </div>
            ) : loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedSubs.length === 0 ? (
              <div className="py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-7 w-7 text-violet-400" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Aucune sous-catégorie</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Ajoute des sous-catégories à <strong>{selectedCat.name}</strong>
                </p>
                <Button size="sm" variant="outline" className="gap-1.5 border-violet-500/30 text-violet-700 hover:bg-violet-500/10" onClick={openNewSubcategory}>
                  <Plus className="h-3.5 w-3.5" />
                  Première sous-catégorie
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                <AnimatePresence>
                  {selectedSubs.map((sub, idx) => {
                    const Icon = getIcon(sub.icon ?? "Folder");
                    const hasProducts = (sub.productCount ?? 0) > 0;
                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3 px-4 py-3 group hover:bg-muted/40 transition-colors"
                      >
                        {/* Icon */}
                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                          <Icon className="h-4.5 w-4.5 text-violet-600" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{sub.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{sub.productCount ?? 0} produit(s)</span>
                            <span className="text-xs text-muted-foreground">· {sub.slug}</span>
                          </div>
                        </div>

                        {/* Stock badge */}
                        {hasProducts && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-[10px] shrink-0">
                            {sub.productCount}
                          </Badge>
                        )}

                        {/* Actions */}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEdit(sub)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                            onClick={() => { setDeletingCategory(sub); setIsDeleteDialogOpen(true); }}
                            disabled={hasProducts}
                            title={hasProducts ? "Contient des produits" : "Supprimer"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Footer CTA */}
                <div className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-dashed border-violet-500/40 text-violet-700 hover:bg-violet-500/10"
                    onClick={openNewSubcategory}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une sous-catégorie à {selectedCat.name}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── DIALOG CREATE / EDIT ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingCategory ? (
                <><Pencil className="h-4 w-4 text-primary" />Modifier</>
              ) : dialogMode === "category" ? (
                <><Plus className="h-4 w-4 text-primary" />Nouvelle catégorie</>
              ) : (
                <><Plus className="h-4 w-4 text-violet-600" />Nouvelle sous-catégorie</>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Parent info for subcategory */}
            {dialogMode === "subcategory" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/8 border border-violet-500/20">
                <Layers className="h-4 w-4 text-violet-600 shrink-0" />
                <span className="text-sm">
                  Sous-catégorie de{" "}
                  <strong className="text-violet-700">
                    {parentCats.find(c => c.id === formData.parentId)?.name ?? "…"}
                  </strong>
                </span>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nom *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder={dialogMode === "subcategory" ? "Ex: iPhone, Samsung…" : "Ex: Téléphones, Informatique…"}
                required
                disabled={submitting}
                className="h-11"
                autoFocus
              />
            </div>

            {/* Icon */}
            <div className="space-y-1.5">
              <Label>Icône</Label>
              <IconPicker />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className={dialogMode === "subcategory" ? "bg-violet-600 hover:bg-violet-700" : ""}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />{editingCategory ? "Enregistrement…" : "Création…"}</>
                ) : (
                  <>{editingCategory ? "Enregistrer" : "Créer"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG DELETE ── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer{" "}
              <strong className="text-foreground">"{deletingCategory?.name}"</strong>{" "}
              définitivement ?
              {((deletingCategory?.productCount ?? 0) > 0 || (deletingCategory?.subcategories?.length ?? 0) > 0) && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Impossible : contient des produits ou sous-catégories.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting || (deletingCategory?.productCount ?? 0) > 0 || (deletingCategory?.subcategories?.length ?? 0) > 0}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Suppression…</> : <><Trash2 className="h-4 w-4 mr-2" />Supprimer</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesManagement;
