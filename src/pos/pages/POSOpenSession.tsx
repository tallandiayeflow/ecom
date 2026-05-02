import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlayCircle } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { saveCurrentSession, cacheProducts } from '../db/posDB';
import { posAPI } from '../lib/posApi';

export default function POSOpenSession() {
  const navigate = useNavigate();
  const { setSession } = usePOS();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await posAPI.openSession(parseFloat(balance) || 0);

      const user = JSON.parse(localStorage.getItem('pos_user') || '{}');
      const sess = {
        id: data.id,
        cashierId: data.cashierId,
        cashierName: user.name,
        openingBalance: data.openingBalance,
        expectedCash: data.expectedCash,
        status: data.status as 'open' | 'closed',
        openedAt: data.openedAt,
      };
      await saveCurrentSession(sess);
      setSession(sess);

      // Pre-cache products for offline use
      try {
        const products = await posAPI.getProducts();
        await cacheProducts(products);
      } catch { /* offline OK */ }

      navigate('/pos/main');
    } catch (err: any) {
      toast.error(err.message || 'Erreur ouverture session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Ouvrir la caisse</CardTitle>
          <p className="text-sm text-muted-foreground">Entrez le fond de caisse de départ</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOpen} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fond de caisse (XOF)</label>
              <Input
                type="number"
                min="0"
                step="500"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="text-xl font-bold h-14 text-center"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Ouvrir la session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
