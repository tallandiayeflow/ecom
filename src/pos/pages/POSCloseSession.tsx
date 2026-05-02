import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, StopCircle, ArrowLeft } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { clearCurrentSession } from '../db/posDB';
import { posAPI } from '../lib/posApi';

export default function POSCloseSession() {
  const navigate = useNavigate();
  const { state, setSession } = usePOS();
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const session = state.session;
  if (!session) {
    navigate('/pos/main');
    return null;
  }

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counted) { toast.error('Entrez le montant compté'); return; }
    setLoading(true);
    try {
      const data = await posAPI.closeSession(session.id, parseFloat(counted), notes);
      await clearCurrentSession();
      setSession(null);
      setReport(data.report);
    } catch (err: any) {
      toast.error(err.message || 'Erreur fermeture');
    } finally {
      setLoading(false);
    }
  };

  if (report) {
    const diff = report.cashDifference ?? 0;
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Z-Report — Session fermée</h1>
            <Button onClick={() => navigate('/pos/login')}>Déconnexion</Button>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Caissier:</span> <strong>{report.cashierName}</strong></div>
                <div><span className="text-muted-foreground">Ventes:</span> <strong>{report.salesCount}</strong></div>
                <div><span className="text-muted-foreground">Total ventes:</span> <strong>{report.totalSales?.toLocaleString()} XOF</strong></div>
                <div><span className="text-muted-foreground">Total espèces:</span> <strong>{report.totalCash?.toLocaleString()} XOF</strong></div>
                <div><span className="text-muted-foreground">Wave:</span> <strong>{report.totalWave?.toLocaleString()} XOF</strong></div>
                <div><span className="text-muted-foreground">Orange Money:</span> <strong>{report.totalOrangeMoney?.toLocaleString()} XOF</strong></div>
                <div><span className="text-muted-foreground">Fond initial:</span> <strong>{report.openingBalance?.toLocaleString()} XOF</strong></div>
                <div><span className="text-muted-foreground">Espèces attendues:</span> <strong>{report.expectedCash?.toLocaleString()} XOF</strong></div>
                <div><span className="text-muted-foreground">Espèces comptées:</span> <strong>{report.closingBalance?.toLocaleString()} XOF</strong></div>
                <div>
                  <span className="text-muted-foreground">Écart:</span>{' '}
                  <Badge variant={diff === 0 ? 'default' : diff > 0 ? 'secondary' : 'destructive'}>
                    {diff >= 0 ? '+' : ''}{diff?.toLocaleString()} XOF
                  </Badge>
                </div>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Remboursements:</span> <strong>{report.totalRefunded?.toLocaleString()} XOF ({report.returnsCount})</strong></div>
                <div><span className="text-muted-foreground">Remises:</span> <strong>{report.totalDiscount?.toLocaleString()} XOF</strong></div>
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => window.print()}>
            Imprimer le Z-Report
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/pos/main')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle>Fermer la caisse</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Espèces attendues: <strong>{session.expectedCash?.toLocaleString()} XOF</strong>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleClose} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Montant compté (XOF)</label>
              <Input
                type="number"
                min="0"
                step="500"
                value={counted}
                onChange={e => setCounted(e.target.value)}
                className="text-xl font-bold h-14 text-center"
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes (optionnel)</label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observations..."
              />
            </div>
            <Button type="submit" variant="destructive" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <StopCircle className="w-4 h-4 mr-2" />}
              Fermer la session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
