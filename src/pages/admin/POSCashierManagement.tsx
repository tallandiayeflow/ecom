import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Key, RefreshCw } from 'lucide-react';
import { posAPI } from '@/pos/lib/posApi';

interface Cashier {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  hasPin: boolean;
  pinLockedUntil: string | null;
}

export default function POSCashierManagement() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', pin: '', role: 'cashier' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await posAPI.listCashiers();
      setCashiers(data);
    } catch {
      toast.error('Erreur chargement caissiers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await posAPI.createCashier(form);
      toast.success('Caissier créé');
      setCreateOpen(false);
      setForm({ name: '', email: '', phone: '', pin: '', role: 'cashier' });
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPin = async (userId: string) => {
    if (!newPin || newPin.length < 4) { toast.error('PIN 4-6 chiffres'); return; }
    setSubmitting(true);
    try {
      await posAPI.resetPin(userId, newPin);
      toast.success('PIN réinitialisé');
      setPinOpen(null);
      setNewPin('');
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Caissiers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nouveau caissier
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cashiers.map(c => (
            <Card key={c.id} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                    {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={c.role === 'admin' ? 'default' : 'secondary'}>
                      {c.role}
                    </Badge>
                    {c.pinLockedUntil && new Date(c.pinLockedUntil) > new Date() && (
                      <Badge variant="destructive" className="text-xs">Verrouillé</Badge>
                    )}
                    {!c.hasPin && (
                      <Badge variant="outline" className="text-xs">Sans PIN</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => { setPinOpen(c.id); setNewPin(''); }}
                >
                  <Key className="w-3 h-3" />
                  {c.hasPin ? 'Changer le PIN' : 'Définir le PIN'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create cashier dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau caissier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder="Nom complet *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            <Input placeholder="Email *" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            <Input placeholder="Téléphone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input
              placeholder="PIN (4-6 chiffres) *"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={form.pin}
              onChange={e => setForm(p => ({ ...p, pin: e.target.value }))}
              required
            />
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashier">Caissier</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" type="button" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button className="flex-1" type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Créer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset PIN dialog */}
      <Dialog open={!!pinOpen} onOpenChange={() => setPinOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le PIN</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nouveau PIN (4-6 chiffres)"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPinOpen(null)}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={() => pinOpen && handleResetPin(pinOpen)} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
