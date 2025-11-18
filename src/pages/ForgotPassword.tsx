import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestPasswordReset } from '@/lib/api';
import { ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    // Validation basique email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setEmailSent(true);
      toast.success('Email envoyé avec succès !');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Écran de confirmation après envoi
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Email envoyé !</CardTitle>
              <CardDescription className="mt-2">
                Nous avons envoyé un lien de réinitialisation à
              </CardDescription>
              <p className="font-semibold text-foreground mt-1">{email}</p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Vérifiez votre boîte de réception</p>
                  <p>Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe.</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-800">
                ⏱️ Le lien est valable pendant <strong>1 heure</strong>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Si vous ne voyez pas l'email, vérifiez vos spams
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setEmailSent(false)}
              >
                Renvoyer l'email
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full" 
                asChild
              >
                <Link to="/auth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la connexion
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulaire de demande
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Mot de passe oublié ?</CardTitle>
            <CardDescription className="mt-2">
              Pas de problème ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Entrez l'adresse email associée à votre compte
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer le lien
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou
                </span>
              </div>
            </div>

            <Button 
              variant="ghost" 
              className="w-full" 
              asChild
            >
              <Link to="/auth">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la connexion
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
