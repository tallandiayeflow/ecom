import PhoneInput from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader, CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LoginData {
  identifier: string; // email ou téléphone complet avec indicatif
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  showEmail: boolean;
}


const Auth = () => {
  const { login, register, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState<LoginData>({ identifier: '', password: '' });
  const [loginCountryCode, setLoginCountryCode] = useState('+221');

  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    phone: '',
    countryCode: '+221',
    password: '',
    confirmPassword: '',
    showEmail: false,
  });

  useEffect(() => {
    if (isAuthenticated && user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || '/';
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    const fullIdentifier = loginCountryCode + loginData.identifier.trim();
    setLoading(true);
    try {
      await login(fullIdentifier, loginData.password);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, countryCode, password, confirmPassword, showEmail } = registerData;
    if (!name || !phone || !password || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (name.trim().length < 2) {
      toast.error('Le nom doit contenir au moins 2 caractères');
      return;
    }
    const fullPhone = `${countryCode}${phone.trim()}`;
    if (phone.trim().length < 6) {
      toast.error('Numéro de téléphone invalide');
      return;
    }
    if (showEmail && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Veuillez entrer un email valide');
        return;
      }
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim() || '', password, name.trim(), fullPhone);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') setLoginData({ identifier: 'admin@exemple.com', password: 'azerty' });
    else setLoginData({ identifier: 'diourbel200901@gmail.com', password: 'azerty' });
    toast.info(`Identifiants ${type} chargés`);
    setActiveTab('login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <Card className="w-full max-w-md shadow-2xl rounded-3xl border-0">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-2xl shadow-lg">
              <img src="logo.png" alt="Logo de NOOR" className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold  bg-clip-text text-transparent">
            NOOR
          </CardTitle>
          <CardDescription className="text-base">
            Connectez-vous ou créez un compte pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              >
                Connexion
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
              >
                Inscription
              </TabsTrigger>
            </TabsList>

            {/* Connexion */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <PhoneInput
                    value={loginData.identifier}
                    countryCode={loginCountryCode}
                    onChange={(v) => setLoginData({ ...loginData, identifier: v })}
                    onCountryChange={setLoginCountryCode}
                    disabled={loading}
                    placeholder="77 123 45 67"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 rounded-xl"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        })
                      }
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl  hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center space-y-2">
                <p className="text-xs text-gray-600">Retour a l'acceuil</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg"
                    onClick={() => navigate('/')}
                  >
                    Acceuil
                  </Button>

                </div>
              </div>
            </TabsContent>

            {/* Inscription */}
            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Prénom Nom"
                      className="pl-10 h-12 rounded-xl"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Téléphone <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    value={registerData.phone}
                    countryCode={registerData.countryCode}
                    onChange={(v) => setRegisterData({ ...registerData, phone: v })}
                    onCountryChange={(c) => setRegisterData({ ...registerData, countryCode: c })}
                    disabled={loading}
                    placeholder="77 123 45 67"
                  />
                  <p className="text-xs text-gray-400">
                    Ce numéro sera votre identifiant de connexion
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-500">
                      Email <span className="text-gray-400 font-normal">(optionnel)</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setRegisterData({ ...registerData, showEmail: !registerData.showEmail, email: '' })}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {registerData.showEmail ? 'Retirer' : '+ Ajouter un email'}
                    </button>
                  </div>
                  {registerData.showEmail && (
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="email@example.com"
                        type="email"
                        className="pl-10 h-12 rounded-xl"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 rounded-xl"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={loading}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Confirmer mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 rounded-xl"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl  hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all"
                  disabled={loading}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inscription...</> : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="text-center text-xs text-gray-500 pb-6">
          En continuant, vous acceptez nos conditions d'utilisation
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
