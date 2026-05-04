import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, RefreshCw, TrendingUp, Users, DollarSign,
  RotateCcw, CreditCard, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { posAPI } from '@/pos/lib/posApi';

const PAYMENT_COLORS: Record<string, string> = {
  Espèces: '#22c55e',
  Wave: '#3b82f6',
  'Orange Money': '#f97316',
  Remises: '#a855f7',
};

const fmt = (n: number) => n?.toLocaleString('fr-FR') ?? '0';

export default function POSReports() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

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

  // Payment breakdown pie data
  const pieData = report ? [
    { name: 'Espèces', value: report.totalCash || 0 },
    { name: 'Wave', value: report.totalWave || 0 },
    { name: 'Orange Money', value: report.totalOrangeMoney || 0 },
  ].filter(d => d.value > 0) : [];

  // Session bar chart data
  const barData = report?.sessions?.map((s: any) => ({
    name: s.cashierName?.split(' ')[0] || 'Caissier',
    ventes: s.totalSales || 0,
    transactions: s.salesCount || 0,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Rapports POS</h1>
        <div className="flex gap-2 items-center">
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
      </div>

      {loading && !report && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" /> Total ventes
                </div>
                <p className="text-2xl font-bold tabular-nums">{fmt(report.totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">XOF</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Transactions
                </div>
                <p className="text-2xl font-bold">{report.salesCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ventes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <Users className="w-4 h-4 text-purple-600" /> Sessions
                </div>
                <p className="text-2xl font-bold">{report.sessionsCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">ouvertes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                  <RotateCcw className="w-4 h-4 text-red-600" /> Remboursements
                </div>
                <p className="text-2xl font-bold text-red-600 tabular-nums">{fmt(report.totalRefunded)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">XOF</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payment breakdown pie */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Répartition paiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toLocaleString()} XOF`} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Sessions bar chart */}
            {barData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Ventes par caissier</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString()} XOF`} />
                      <Bar dataKey="ventes" fill="#22c55e" radius={[4, 4, 0, 0]} name="Ventes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment detail */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Détail encaissements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">Espèces</p>
                  <p className="font-bold tabular-nums">{fmt(report.totalCash)} XOF</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">Wave</p>
                  <p className="font-bold tabular-nums">{fmt(report.totalWave)} XOF</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">Orange Money</p>
                  <p className="font-bold tabular-nums">{fmt(report.totalOrangeMoney)} XOF</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">Remises totales</p>
                  <p className="font-bold tabular-nums">{fmt(report.totalDiscount)} XOF</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions detail */}
          {report.sessions?.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Détail par session</h2>
              {report.sessions.map((s: any) => (
                <Card key={s.sessionId} className="shadow-sm">
                  <CardContent className="p-0">
                    <button
                      className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-lg text-left"
                      onClick={() => setExpandedSession(expandedSession === s.sessionId ? null : s.sessionId)}
                    >
                      <div>
                        <p className="font-semibold">{s.cashierName}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.openedAt ? new Date(s.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {s.closedAt ? ` → ${new Date(s.closedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ' (ouverte)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold tabular-nums">{fmt(s.totalSales)} XOF</p>
                          <p className="text-xs text-muted-foreground">{s.salesCount} ventes</p>
                        </div>
                        {expandedSession === s.sessionId
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </button>

                    {expandedSession === s.sessionId && (
                      <div className="px-4 pb-4">
                        <Separator className="mb-3" />
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground">Fond initial</p>
                            <p className="font-medium tabular-nums">{fmt(s.openingBalance)} XOF</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Espèces</p>
                            <p className="font-medium tabular-nums">{fmt(s.totalCash)} XOF</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Espèces attendues</p>
                            <p className="font-medium tabular-nums">{fmt(s.expectedCash)} XOF</p>
                          </div>
                          {s.cashDifference !== null && s.cashDifference !== undefined && (
                            <div>
                              <p className="text-muted-foreground">Écart</p>
                              <p className={`font-bold tabular-nums ${s.cashDifference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {s.cashDifference >= 0 ? '+' : ''}{fmt(s.cashDifference)} XOF
                              </p>
                            </div>
                          )}
                        </div>
                        {s.closedAt && (
                          <Badge variant={s.cashDifference === 0 ? 'secondary' : s.cashDifference > 0 ? 'default' : 'destructive'} className="mt-3 text-xs">
                            {s.cashDifference === 0 ? 'Caisse équilibrée' : s.cashDifference > 0 ? 'Surplus' : 'Déficit'}
                          </Badge>
                        )}
                      </div>
                    )}
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
