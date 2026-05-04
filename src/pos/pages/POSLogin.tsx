import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { getCurrentSession, saveCurrentSession } from '../db/posDB';

const API = import.meta.env.VITE_API_URL || '';

export default function POSLogin() {
  const navigate = useNavigate();
  const { setUser, setSession } = usePOS();
  const [email, setEmail] = useState('');
  const [pin, setPin]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/pos/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de connexion');

      localStorage.setItem('pos_token', data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.user));
      setUser(data.user);

      // Check for an existing open session
      const token = data.token;
      const sessionRes = await fetch(`${API}/pos/sessions/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sessionData = await sessionRes.json();

      if (sessionData.id) {
        const sess = {
          id: sessionData.id,
          cashierId: sessionData.cashierId,
          cashierName: data.user.name,
          openingBalance: sessionData.openingBalance,
          expectedCash: sessionData.expectedCash,
          status: sessionData.status as 'open' | 'closed',
          openedAt: sessionData.openedAt,
        };
        await saveCurrentSession(sess);
        setSession(sess);
        navigate('/pos/main');
      } else {
        navigate('/pos/open-session');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden border shadow-lg bg-white flex items-center justify-center">
            <img src="/logo.png" alt="NOOR" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">NOOR POS</CardTitle>
          <p className="text-sm text-muted-foreground">Connexion caisse</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="caissier@noor.sn"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">PIN</label>
              <Input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
