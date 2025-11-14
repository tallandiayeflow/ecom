"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createVoucher, deleteVoucher, getVouchers, updateVoucher } from "@/lib/api";
import type { VoucherData } from "@/types";
import { Loader2, PlusCircle, RefreshCcw, Search, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState<VoucherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherData | null>(null);
  const [form, setForm] = useState<Omit<VoucherData, "id" | "usedCount" | "discount">>({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    minPurchase: 0,
    maxUses: 0,
    validFrom: "",
    validUntil: "",
    isActive: true,
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const data = await getVouchers();
      setVouchers(data);
    } catch {
      toast.error("Erreur lors du chargement des codes promo");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (voucher?: VoucherData) => {
    if (voucher) {
      setSelectedVoucher(voucher);
      setIsNew(false);
      setForm({
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minPurchase: voucher.minPurchase,
        maxUses: voucher.maxUses ?? 0,
        validFrom: voucher.validFrom?.slice(0, 16) ?? "",
        validUntil: voucher.validUntil?.slice(0, 16) ?? "",
        isActive: voucher.isActive,
      });
    } else {
      setSelectedVoucher(null);
      setIsNew(true);
      setForm({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        minPurchase: 0,
        maxUses: 0,
        validFrom: "",
        validUntil: "",
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleChange = (field: keyof typeof form, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("Le code est obligatoire");
      return;
    }
    try {
      if (isNew) {
        await createVoucher(form);
        toast.success("Code promo créé avec succès 🎉");
      } else if (selectedVoucher) {
        await updateVoucher(selectedVoucher.id!, form);
        toast.success("Code promo mis à jour ✅");
      }
      setDialogOpen(false);
      fetchVouchers();
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmez-vous la suppression de ce code promo ?")) return;
    try {
      await deleteVoucher(id);
      toast.success("Code promo supprimé 🗑️");
      fetchVouchers();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🎁 Gestion des Codes Promo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Créez, modifiez et gérez vos coupons de réduction facilement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchVouchers} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Actualiser
          </Button>
          <Button
            onClick={() => openDialog()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Nouveau code
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un code promo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 py-2"
        />
      </div>

      {/* Table / Cards */}
      <div className="bg-card rounded-2xl border shadow-md overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">
            Aucun code promo trouvé 💤
          </p>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            {/* Desktop Table */}
            <table className="min-w-full table-auto border-separate border-spacing-0">
              <thead className="bg-muted/40 text-sm">
                <tr>
                  <th className="p-3 text-left">Code</th>
                  <th>Type</th>
                  <th>Valeur</th>
                  <th>Min Achat</th>
                  <th>Max Utilisations</th>
                  <th>Utilisées</th>
                  <th>Début</th>
                  <th>Expiration</th>
                  <th>Actif</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-2 font-medium">{voucher.code}</td>
                    <td>{voucher.discountType === "percentage" ? "Pourcentage" : "Fixe"}</td>
                    <td>{voucher.discountValue}</td>
                    <td>{voucher.minPurchase}</td>
                    <td>{voucher.maxUses}</td>
                    <td>{voucher.usedCount || 0}</td>
                    <td>{voucher.validFrom?.slice(0, 10)}</td>
                    <td>{voucher.validUntil?.slice(0, 10)}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          voucher.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {voucher.isActive ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openDialog(voucher)}>
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(voucher.id!)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 p-4">
          {filteredVouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="bg-background border rounded-xl shadow p-4 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{voucher.code}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    voucher.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {voucher.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
              <p className="text-sm">
                {voucher.discountType === "percentage" ? "Pourcentage" : "Fixe"} :{" "}
                {voucher.discountValue}
              </p>
              <p className="text-sm">Min Achat: {voucher.minPurchase}</p>
              <p className="text-sm">Max Utilisations: {voucher.maxUses}</p>
              <p className="text-sm">Utilisées: {voucher.usedCount || 0}</p>
              <p className="text-sm">Début: {voucher.validFrom?.slice(0, 10)}</p>
              <p className="text-sm">Expiration: {voucher.validUntil?.slice(0, 10)}</p>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="outline" size="sm" onClick={() => openDialog(voucher)}>
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(voucher.id!)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-background text-foreground border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {isNew ? "Créer un nouveau code promo" : "Modifier le code promo"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4 mt-4"
          >
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="discountType">Type de réduction</Label>
              <select
                id="discountType"
                value={form.discountType}
                onChange={(e) => handleChange("discountType", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Fixe</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="discountValue">Valeur</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => handleChange("discountValue", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="minPurchase">Min Achat</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) => handleChange("minPurchase", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="maxUses">Max Utilisations</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => handleChange("maxUses", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="validFrom">Début</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => handleChange("validFrom", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="validUntil">Expiration</Label>
                <Input
                  id="validUntil"
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => handleChange("validUntil", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => handleChange("isActive", e.target.checked)}
                  className="accent-blue-500"
                />
                <Label htmlFor="isActive">Actif</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
              >
                {isNew ? "Créer" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VouchersManagement;
