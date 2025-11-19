// Enhanced and responsive Profile Page with improved UI and a button to navigate to /rewards
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import api, { getUserInfo, updateUserProfile } from '@/lib/api';
import { Award, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [updating, setUpdating] = useState(false);

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

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
        address: data.address || '' 
      });
      setLoyaltyPoints(data.loyaltyPoints || 0);
    } catch {
      toast.error('Erreur lors du chargement du profil');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Mot de passe modifié avec succès');
      
      // Réinitialiser le formulaire
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Déconnexion réussie');
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold mb-6 text-center">Mon Profil</h1>

        <Tabs defaultValue="info" className="space-y-6 w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-2 gap-4 bg-background p-2 rounded-xl shadow-md">
            <TabsTrigger value="info" className="rounded-lg">Informations</TabsTrigger>
            <TabsTrigger value="loyalty" className="rounded-lg">Fidélité</TabsTrigger>
          </TabsList>

          {/* INFO SECTION */}
          <TabsContent value="info" className="p-2 sm:p-4 space-y-6">
            {/* Carte Informations personnelles */}
            <Card className="w-full shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Informations personnelles</CardTitle>
                <CardDescription>Mettez à jour vos informations</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />Nom complet
                      </Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={e => handleInputChange('name', e.target.value)} 
                        required 
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />Email
                      </Label>
                      <Input id="email" type="email" value={formData.email} disabled />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />Téléphone
                      </Label>
                      <Input 
                        id="phone" 
                        value={formData.phone} 
                        onChange={e => handleInputChange('phone', e.target.value)} 
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input 
                        id="address" 
                        value={formData.address} 
                        onChange={e => handleInputChange('address', e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between mt-4 gap-3">
                    <Button type="submit" className="flex-1 py-3 rounded-xl" disabled={updating}>
                      {updating ? 'Mise à jour...' : 'Enregistrer'}
                    </Button>
                    <Button onClick={handleLogout} variant="outline" className="flex-1 py-3 rounded-xl">
                      Se déconnecter
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Carte Changement de mot de passe */}
            <Card className="w-full shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Sécurité
                </CardTitle>
                <CardDescription>Modifiez votre mot de passe</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="oldPassword">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        type={showOldPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordData.oldPassword}
                        onChange={e => handlePasswordChange('oldPassword', e.target.value)}
                        className="pr-10"
                        disabled={changingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordData.newPassword}
                        onChange={e => handlePasswordChange('newPassword', e.target.value)}
                        className="pr-10"
                        disabled={changingPassword}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordData.newPassword && passwordData.newPassword.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">Minimum 6 caractères</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordData.confirmPassword}
                        onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                        className="pr-10"
                        disabled={changingPassword}
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordData.confirmPassword && 
                     passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-3 rounded-xl" 
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Modification en cours...' : 'Changer le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOYALTY SECTION */}
          <TabsContent value="loyalty" className="p-2 sm:p-4">
            <Card className="w-full shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Programme de fidélité</CardTitle>
                <CardDescription>Cumulez des points et économisez</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
                  <Award className="h-16 w-16 text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Vos points disponibles</p>
                  <p className="text-5xl font-bold text-primary">{loyaltyPoints}</p>
                </div>

                <Button 
                  onClick={() => navigate('/rewards')} 
                  className="w-full py-3 rounded-xl text-lg font-semibold shadow-md"
                >
                  Échanger mes points
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
