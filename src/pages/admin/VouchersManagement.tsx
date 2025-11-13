"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Loader2, PlusCircle, RefreshCcw, Search, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { createVoucher, deleteVoucher, getVouchers, updateVoucher } from "@/lib/api";
import type { VoucherData } from "@/types";

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
    expiryDate: "",
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
        maxUses: voucher.maxUses,
        expiryDate: voucher.expiryDate.slice(0, 10),
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
        expiryDate: "",
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

  const filteredVouchers = vouchers.filter(v => v.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.header
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            🎁 Gestion des Codes Promo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Créez, modifiez et gérez vos coupons de réduction facilement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchVouchers} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
            Actualiser
          </Button>
          <Button
            onClick={() => openDialog()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Nouveau code
          </Button>
        </div>
      </motion.header>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher un code promo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 py-2"
        />
      </div>

      {/* Table */}
      <motion.div
        className="bg-card rounded-2xl border shadow-md overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {filteredVouchers.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">
            Aucun code promo trouvé 💤
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-sm">
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Min Achat</TableHead>
                <TableHead>Max Utilisations</TableHead>
                <TableHead>Utilisées</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map((voucher, idx) => (
                <motion.tr
                  key={voucher.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="font-medium">{voucher.code}</TableCell>
                  <TableCell>
                    {voucher.discountType === "percentage" ? "Pourcentage" : "Fixe"}
                  </TableCell>
                  <TableCell>{voucher.discountValue}</TableCell>
                  <TableCell>{voucher.minPurchase}</TableCell>
                  <TableCell>{voucher.maxUses}</TableCell>
                  <TableCell>{voucher.usedCount || 0}</TableCell>
                  <TableCell>{voucher.expiryDate?.slice(0, 10)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        voucher.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {voucher.isActive ? "Oui" : "Non"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialog(voucher)}
                      className="hover:bg-blue-50"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(voucher.id!)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

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
                onChange={(e) =>
                  handleChange("discountType", e.target.value)
                }
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
                  onChange={(e) =>
                    handleChange("discountValue", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="minPurchase">Min Achat</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  value={form.minPurchase}
                  onChange={(e) =>
                    handleChange("minPurchase", Number(e.target.value))
                  }
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
                  onChange={(e) =>
                    handleChange("maxUses", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiration</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    handleChange("expiryDate", e.target.value)
                  }
                />
              </div>
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
