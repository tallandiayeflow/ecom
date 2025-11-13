import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInfo, updateUserProfile } from '@/lib/api';
import { Award, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserInfo();
  }, [user]);

  const loadUserInfo = async () => {
    try {
      const data = await getUserInfo();
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
      setLoyaltyPoints(data.loyaltyPoints || 0);
    } catch {
      toast.error('Erreur lors du chargement du profil');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateUserProfile(formData);
      toast.success('Profil mis à jour');
      await refreshUser();
    } catch {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Mon Profil</h1>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="loyalty">Fidélité</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="p-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>Mettez à jour vos informations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name"><User className="inline h-4 w-4 mr-2" />Nom complet</Label>
                      <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="email"><Mail className="inline h-4 w-4 mr-2" />Email</Label>
                      <Input id="email" type="email" value={formData.email} disabled />
                    </div>
                    <div>
                      <Label htmlFor="phone"><Phone className="inline h-4 w-4 mr-2" />Téléphone</Label>
                      <Input id="phone" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between mt-4 gap-2">
                    <Button type="submit" className="flex-1" disabled={updating}>
                      {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
                    </Button>
                    <Button onClick={handleLogout} variant="outline" className="flex-1">
                      Se déconnecter
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty" className="p-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Programme de fidélité</CardTitle>
                <CardDescription>Cumulez des points et économisez</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 rounded bg-gradient-to-br from-primary/10 to-primary/5">
                  <Award className="h-16 w-16 text-primary mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Vos points de fidélité</p>
                  <p className="text-5xl font-bold text-primary">{loyaltyPoints}</p>
                  <p className="text-sm text-muted-foreground mt-2">points disponibles</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
