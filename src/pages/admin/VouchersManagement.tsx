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
import { Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { Voucher } from '@/types';
import { format } from 'date-fns';

const VouchersManagement = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    expiryDate: '',
  });

  const generateCode = () => {
    const code = 'PROMO' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, code });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newVoucher: Voucher = {
      id: `voucher-${Date.now()}`,
      code: formData.code,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPurchase: parseFloat(formData.minPurchase),
      maxUses: parseInt(formData.maxUses),
      usedCount: 0,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setVouchers([...vouchers, newVoucher]);
    toast.success('Bon d\'achat créé avec succès');
    setIsDialogOpen(false);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minPurchase: '',
      maxUses: '',
      expiryDate: '',
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié dans le presse-papier');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Bons d'Achat</h1>
          <p className="text-muted-foreground mt-1">
            Créez des codes promotionnels
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Générer un bon d'achat
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Réduction</TableHead>
              <TableHead>Achat minimum</TableHead>
              <TableHead>Utilisations</TableHead>
              <TableHead>Date d'expiration</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucun bon d'achat créé pour le moment
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((voucher) => (
                <TableRow key={voucher.id}>
                  <TableCell>
                    <code className="font-mono font-bold text-primary">{voucher.code}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {voucher.discountType === 'percentage' ? 'Pourcentage' : 'Fixe'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {voucher.discountType === 'percentage'
                      ? `${voucher.discountValue}%`
                      : `${voucher.discountValue} DH`}
                  </TableCell>
                  <TableCell>{voucher.minPurchase} DH</TableCell>
                  <TableCell>
                    {voucher.usedCount} / {voucher.maxUses}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(voucher.expiryDate), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={voucher.isActive ? 'default' : 'secondary'}>
                      {voucher.isActive ? 'Actif' : 'Expiré'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyCode(voucher.code)}
                      title="Copier le code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Générer un bon d'achat</DialogTitle>
            <DialogDescription>
              Créez un code promotionnel pour vos clients
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code du bon</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="PROMO2024"
                  required
                />
                <Button type="button" variant="outline" onClick={generateCode}>
                  Générer
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Type de réduction</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData({ ...formData, discountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  Valeur {formData.discountType === 'percentage' ? '(%)' : '(DH)'}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPurchase">Achat minimum (DH)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  step="0.01"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">Utilisations max</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date d'expiration</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer le bon</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VouchersManagement;
