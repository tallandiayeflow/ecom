import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInfo, getUserVouchers, redeemLoyaltyPoints } from '@/lib/api';
import { ArrowLeft, CheckCircle2, Copy, Gift, Info, Loader2, Sparkles, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface RewardOption {
  id: string;
  name: string;
  pointsCost: number;
  voucherValue: number;
  description: string;
  icon: string;
}

interface GeneratedVoucher {
  code: string;
  value: number;
  validFrom: string;
  validUntil: string;
}

interface UserVoucher {
  id: string;
  code: string;
  type: string;
  value: number;
  minPurchase: number;
  validFrom: string;
  validUntil: string;
  usedCount: number;
  maxUses: number;
}

const LoyaltyRewards = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [generatedVoucher, setGeneratedVoucher] = useState<GeneratedVoucher | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const rewardOptions: RewardOption[] = [
    {
      id: '1',
      name: 'Bon de 5 000 FCFA',
      pointsCost: 500,
      voucherValue: 5000,
      description: 'Valable sur tout le site',
      icon: '🎁'
    },
    {
      id: '2',
      name: 'Bon de 10 000 FCFA',
      pointsCost: 900,
      voucherValue: 10000,
      description: 'Valable sur tout le site',
      icon: '💎'
    },
    {
      id: '3',
      name: 'Bon de 25 000 FCFA',
      pointsCost: 2000,
      voucherValue: 25000,
      description: 'Valable sur tout le site',
      icon: '⭐'
    },
    {
      id: '4',
      name: 'Bon de 50 000 FCFA',
      pointsCost: 3500,
      voucherValue: 50000,
      description: 'Valable sur tout le site',
      icon: '👑'
    }
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserData();
    loadUserVouchers();
  }, [user, authLoading, navigate]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await getUserInfo();
      setLoyaltyPoints(data.loyaltyPoints || 0);
    } catch {
      toast.error('Impossible de charger vos informations');
    } finally {
      setLoading(false);
    }
  };

  const loadUserVouchers = async () => {
    try {
      setLoadingVouchers(true);
      const vouchers = await getUserVouchers();
      setUserVouchers(vouchers);
    } catch (error) {
      console.error('Error loading vouchers:', error);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleRedeem = async (reward: RewardOption) => {
    if (loyaltyPoints < reward.pointsCost) {
      toast.error('Vous n\'avez pas assez de points');
      return;
    }

    setRedeeming(reward.id);
    try {
      const result = await redeemLoyaltyPoints(reward.pointsCost, reward.voucherValue);
      
      setLoyaltyPoints(result.remainingPoints);
      setGeneratedVoucher(result.voucher);
      setShowVoucherModal(true);
      
      toast.success(`✨ Bon de ${reward.voucherValue.toLocaleString()} FCFA généré !`);
      loadUserVouchers();
    } catch (error: any) {
      console.error('Error redeeming points:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de l\'échange');
    } finally {
      setRedeeming(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copié !');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au profil
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Programme de Fidélité</h1>
              <p className="text-muted-foreground">
                Bonjour {user.name}, échangez vos points contre des récompenses
              </p>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <Card className="mb-6 border-2 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Vos points disponibles</p>
                <p className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {loyaltyPoints.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Gagnez 10 points pour chaque 1000 FCFA dépensé
                </p>
              </div>
              <Gift className="h-16 w-16 md:h-20 md:w-20 text-primary/20" />
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            Les bons d'achat générés sont valables 30 jours et utilisables sur tout le site
          </AlertDescription>
        </Alert>

        {/* Rewards Grid */}
        <div className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-5">Récompenses disponibles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewardOptions.map(reward => {
              const canRedeem = loyaltyPoints >= reward.pointsCost;
              const isRedeeming = redeeming === reward.id;

              return (
                <Card
                  key={reward.id}
                  className={`relative transition-all duration-300 ${
                    canRedeem ? 'hover:shadow-xl hover:-translate-y-1 border-2 hover:border-primary/50' : 'opacity-50'
                  }`}
                >
                  {!canRedeem && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-lg">
                      <Badge variant="secondary" className="text-xs">Points insuffisants</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center space-y-3 pb-4">
                    <div className="text-5xl">{reward.icon}</div>
                    <div>
                      <CardTitle className="text-lg mb-1">{reward.name}</CardTitle>
                      <CardDescription className="text-xs">{reward.description}</CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="text-center space-y-4 pb-4">
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                      <p className="text-2xl font-bold text-primary mb-1">
                        {reward.pointsCost.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points requis</p>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Valeur du bon</p>
                      <p className="text-xl font-bold">
                        {reward.voucherValue.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FCFA</span>
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      className="w-full"
                      onClick={() => handleRedeem(reward)}
                      disabled={!canRedeem || isRedeeming}
                      variant={canRedeem ? "default" : "secondary"}
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Échange...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Échanger
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User Vouchers Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl md:text-2xl font-semibold">Mes bons d'achat</h2>
            <Button variant="outline" size="sm" onClick={loadUserVouchers} disabled={loadingVouchers}>
              {loadingVouchers ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualiser'}
            </Button>
          </div>

          {userVouchers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Ticket className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-2">Aucun bon d'achat pour le moment</p>
                <p className="text-sm text-muted-foreground">Échangez vos points pour obtenir des récompenses</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userVouchers.map(voucher => (
                <Card key={voucher.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold">
                          {voucher.value.toLocaleString()} <span className="text-base font-normal text-muted-foreground">FCFA</span>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Valide jusqu'au {formatDate(voucher.validUntil)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Actif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <code className="font-mono font-bold text-lg tracking-wider">{voucher.code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(voucher.code)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {voucher.minPurchase > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Achat minimum: <span className="font-medium text-foreground">{voucher.minPurchase.toLocaleString()} FCFA</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Comment ça fonctionne ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Achetez</h4>
                  <p className="text-sm text-muted-foreground">
                    Gagnez des points à chaque commande validée
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Cumulez</h4>
                  <p className="text-sm text-muted-foreground">
                    Vos points s'accumulent automatiquement
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Échangez</h4>
                  <p className="text-sm text-muted-foreground">
                    Obtenez des bons d'achat instantanément
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voucher Success Modal */}
        <Dialog open={showVoucherModal} onOpenChange={setShowVoucherModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Bon d'achat généré avec succès !
              </DialogTitle>
              <DialogDescription>
                Votre bon est prêt à être utilisé. Conservez ce code précieusement.
              </DialogDescription>
            </DialogHeader>

            {generatedVoucher && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-muted-foreground mb-3 text-center">Votre code :</p>
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                    <code className="font-mono font-bold text-2xl text-green-600 tracking-wider">
                      {generatedVoucher.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedVoucher.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valeur:</span>
                    <span className="font-semibold">{generatedVoucher.value.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valide jusqu'au:</span>
                    <span className="font-semibold">{formatDate(generatedVoucher.validUntil)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowVoucherModal(false);
                      navigate('/');
                    }}
                  >
                    Faire mes achats
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowVoucherModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LoyaltyRewards;
