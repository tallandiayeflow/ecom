import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createProduct,
  getCategories,
  getImageUrl,
  getProduct,
  ProductPayload,
  updateProduct,
  uploadProductImage,
} from "@/lib/api";
import type { Category, Product } from "@/types";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Save,
  Settings2,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type SpecRow = { key: string; value: string };

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "",
  brand: "",
  stockQuantity: "",
  colors: "",
  sizes: "",
  images: [] as string[],
};

const ProductForm = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isEdit = !!productId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]);

  // ── load categories ──────────────────────────────────────────
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => toast.error("Erreur chargement catégories"));
  }, []);

  // ── load product for edit ────────────────────────────────────
  useEffect(() => {
    if (!productId) return;
    setLoadingProduct(true);
    getProduct(productId)
      .then((p: Product) => {
        setForm({
          name: p.name,
          description: p.description,
          price: p.price.toString(),
          originalPrice: p.originalPrice?.toString() ?? "",
          category: p.category,
          brand: p.brand ?? "",
          stockQuantity: p.stockQuantity.toString(),
          colors: (p.colors ?? []).join(", "),
          sizes: (p.sizes ?? []).join(", "),
          images: p.images ?? [],
        });
        setSpecs(
          Object.entries(p.specifications ?? {}).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
        setSubcategoryIds((p.subcategories ?? []).map((s) => s.id));
      })
      .catch(() => {
        toast.error("Produit introuvable");
        navigate("/admin/products");
      })
      .finally(() => setLoadingProduct(false));
  }, [productId]);

  // ── spec helpers ─────────────────────────────────────────────
  const addSpec = () => setSpecs((p) => [...p, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((p) => p.filter((_, idx) => idx !== i));
  const updateSpec = (i: number, field: keyof SpecRow, val: string) =>
    setSpecs((p) => p.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));

  // ── subcategory toggle ───────────────────────────────────────
  const toggleSub = (id: string) =>
    setSubcategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ── image helpers ────────────────────────────────────────────
  const setImage = (idx: number, val: string) =>
    setForm((f) => {
      const imgs = [...f.images];
      imgs[idx] = val;
      return { ...f, images: imgs };
    });

  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ""] }));

  const removeImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleUpload = async (file: File, idx: number) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 10 Mo)");
      return;
    }
    try {
      setUploadingIdx(idx);
      const data = await uploadProductImage(file);
      setImage(idx, data.url);
      toast.success("Image uploadée !");
    } catch (err: any) {
      toast.error(
        err.response?.status === 413
          ? "Image trop lourde pour le serveur"
          : err.response?.data?.error ?? "Erreur upload"
      );
    } finally {
      setUploadingIdx(null);
    }
  };

  // ── submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      toast.error("Nom, prix et catégorie sont obligatoires");
      return;
    }

    const cleanImages = form.images.filter((img) => img.trim());

    const payload: ProductPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      category: form.category,
      brand: form.brand.trim(),
      stockQuantity: parseInt(form.stockQuantity) || 0,
      images: cleanImages,
      image_url: cleanImages[0] ?? "",
      specifications: Object.fromEntries(
        specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value.trim()])
      ),
      colors: form.colors
        ? form.colors.split(",").map((c) => c.trim()).filter(Boolean)
        : undefined,
      sizes: form.sizes
        ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      subcategory_ids: subcategoryIds,
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        await updateProduct(productId!, payload);
        toast.success("Produit modifié ✅");
      } else {
        await createProduct(payload);
        toast.success("Produit créé 🎉");
      }
      navigate("/admin/products");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erreur de sauvegarde");
    } finally {
      setSubmitting(false);
    }
  };

  // ── active category's subcategories ─────────────────────────
  const activeSubs =
    categories.find((c) => c.slug === form.category)?.subcategories ?? [];

  // ── loading skeleton ─────────────────────────────────────────
  if (loadingProduct) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((n) => (
              <Card key={n}>
                <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-400">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/products")}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            {isEdit ? (
              <Pencil className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5 text-primary" />
            )}
            <h1 className="text-2xl font-bold">
              {isEdit ? "Modifier le produit" : "Nouveau produit"}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/products")}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            form="product-form"
            type="submit"
            disabled={submitting}
            className="gap-2 min-w-[120px]"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement...</>
            ) : (
              <><Save className="h-4 w-4" />{isEdit ? "Enregistrer" : "Créer"}</>
            )}
          </Button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Informations de base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: iPhone 15 Pro Max 256 Go"
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Ex: Apple, Samsung…"
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description détaillée du produit…"
                    rows={5}
                    disabled={submitting}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Prix & Stock */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Prix & Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix de vente (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="450000"
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">
                    Prix barré (FCFA)
                    <span className="text-muted-foreground font-normal ml-1 text-xs">optionnel</span>
                  </Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    min="0"
                    step="1"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    placeholder="500000"
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Quantité en stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    placeholder="0"
                    required
                    disabled={submitting}
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Variantes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Variantes
                  <span className="text-muted-foreground font-normal ml-1 text-xs normal-case">(optionnel)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="colors">Couleurs</Label>
                  <Input
                    id="colors"
                    value={form.colors}
                    onChange={(e) => setForm({ ...form, colors: e.target.value })}
                    placeholder="noir, blanc, bleu"
                    disabled={submitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Sépare par des virgules</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sizes">Tailles / Capacités</Label>
                  <Input
                    id="sizes"
                    value={form.sizes}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                    placeholder="S, M, L  —  ou  64Go, 128Go"
                    disabled={submitting}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Sépare par des virgules</p>
                </div>
              </CardContent>
            </Card>

            {/* Caractéristiques techniques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Caractéristiques techniques
                  <span className="text-muted-foreground font-normal text-xs normal-case">(optionnel)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {specs.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune caractéristique. Clique sur le bouton pour en ajouter.
                  </p>
                )}

                {/* Header row */}
                {specs.length > 0 && (
                  <div className="grid grid-cols-[2fr_2fr_auto] gap-2 px-1">
                    <span className="text-xs font-medium text-muted-foreground">Nom</span>
                    <span className="text-xs font-medium text-muted-foreground">Valeur</span>
                    <span />
                  </div>
                )}

                {specs.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_2fr_auto] gap-2 items-center">
                    <Input
                      placeholder="Ex: RAM"
                      value={spec.key}
                      onChange={(e) => updateSpec(idx, "key", e.target.value)}
                      disabled={submitting}
                      className="h-9"
                    />
                    <Input
                      placeholder="Ex: 8 Go"
                      value={spec.value}
                      onChange={(e) => updateSpec(idx, "value", e.target.value)}
                      disabled={submitting}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSpec(idx)}
                      disabled={submitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={addSpec}
                  disabled={submitting}
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une caractéristique
                </Button>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images du produit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.images.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune image. Clique sur le bouton pour en ajouter.</p>
                )}

                {form.images.map((img, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Preview thumb */}
                    <div className="w-10 h-10 rounded-lg border overflow-hidden bg-muted shrink-0">
                      {img ? (
                        <img
                          src={getImageUrl(img)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex gap-2">
                      <Input
                        value={img}
                        onChange={(e) => setImage(idx, e.target.value)}
                        placeholder="URL de l'image"
                        disabled={submitting || uploadingIdx === idx}
                        className="h-10"
                      />
                      {/* Upload */}
                      <div className="relative">
                        <input
                          type="file"
                          id={`upload-${idx}`}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file, idx);
                          }}
                          disabled={submitting || uploadingIdx === idx}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() =>
                            document.getElementById(`upload-${idx}`)?.click()
                          }
                          disabled={submitting || uploadingIdx === idx}
                        >
                          {uploadingIdx === idx ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => removeImage(idx)}
                      disabled={submitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={addImage}
                    disabled={submitting}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une image
                  </Button>
                  {form.images.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      La première image sera l'image principale
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-6">

            {/* Catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Catégorie *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    setForm((f) => ({ ...f, category: v }));
                    setSubcategoryIds([]);
                  }}
                  disabled={submitting}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sélectionner…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeSubs.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Sous-catégories</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeSubs.map((sub) => {
                        const selected = subcategoryIds.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSub(sub.id)}
                            disabled={submitting}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border hover:bg-muted"
                            }`}
                          >
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Image preview — first image */}
            {form.images.find((img) => img.trim()) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Aperçu image principale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-xl overflow-hidden border bg-muted">
                    <img
                      src={getImageUrl(form.images.find((img) => img.trim())!)}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-product.png";
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Résumé rapide */}
            {(form.name || form.price) && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Résumé
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {form.name && (
                    <p className="font-semibold truncate">{form.name}</p>
                  )}
                  {form.price && (
                    <p className="text-primary font-bold text-lg">
                      {parseFloat(form.price || "0").toLocaleString("fr-FR")} FCFA
                      {form.originalPrice && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          {parseFloat(form.originalPrice).toLocaleString("fr-FR")}
                        </span>
                      )}
                    </p>
                  )}
                  {form.stockQuantity && (
                    <p className="text-muted-foreground text-xs">
                      Stock : {form.stockQuantity} unité(s)
                    </p>
                  )}
                  {specs.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {specs.filter((s) => s.key.trim()).length} caractéristique(s)
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Save button (sticky on mobile) */}
            <Button
              form="product-form"
              type="submit"
              disabled={submitting}
              className="w-full gap-2 h-12"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</>
              ) : (
                <><Save className="h-4 w-4" />{isEdit ? "Enregistrer les modifications" : "Créer le produit"}</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
