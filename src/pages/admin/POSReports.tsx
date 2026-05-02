import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCw, TrendingUp, Users, DollarSign } from 'lucide-react';
import { posAPI } from '@/pos/lib/posApi';

export default function POSReports() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await posAPI.getDailyReport(date);
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || 'Erreur rapport');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapports POS</h1>

      {/* Date picker */}
      <div className="flex gap-3 items-center">
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-40"
        />
        <Button onClick={loadReport} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Charger
        </Button>
      </div>

      {report && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <TrendingUp className="w-4 h-4" /> Total ventes
                </div>
                <p className="text-2xl font-bold">{report.totalSales?.toLocaleString()} <span className="text-sm font-medium">XOF</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="w-4 h-4" /> Transactions
                </div>
                <p className="text-2xl font-bold">{report.salesCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="w-4 h-4" /> Sessions
                </div>
                <p className="text-2xl font-bold">{report.sessionsCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-muted-foreground text-sm mb-1">Remboursements</div>
                <p className="text-2xl font-bold text-red-600">{report.totalRefunded?.toLocaleString()} <span className="text-sm">XOF</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Payment breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition par mode de paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Espèces</p>
                  <p className="font-bold">{report.totalCash?.toLocaleString()} XOF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Wave</p>
                  <p className="font-bold">{report.totalWave?.toLocaleString()} XOF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Orange Money</p>
                  <p className="font-bold">{report.totalOrangeMoney?.toLocaleString()} XOF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remises</p>
                  <p className="font-bold">{report.totalDiscount?.toLocaleString()} XOF</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions detail */}
          {report.sessions?.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold">Détail par session</h2>
              {report.sessions.map((s: any) => (
                <Card key={s.sessionId} className="shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{s.cashierName}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.openedAt ? new Date(s.openedAt).toLocaleTimeString('fr-FR') : '-'}
                          {s.closedAt ? ` → ${new Date(s.closedAt).toLocaleTimeString('fr-FR')}` : ' (ouverte)'}
                        </p>
                      </div>
                      <p className="font-bold text-lg">{s.totalSales?.toLocaleString()} XOF</p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Ventes: <strong className="text-foreground">{s.salesCount}</strong></div>
                      <div>Espèces: <strong className="text-foreground">{s.totalCash?.toLocaleString()}</strong></div>
                      {s.cashDifference !== null && (
                        <div>
                          Écart: <strong className={s.cashDifference < 0 ? 'text-red-600' : 'text-green-600'}>
                            {s.cashDifference >= 0 ? '+' : ''}{s.cashDifference?.toLocaleString()}
                          </strong>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
