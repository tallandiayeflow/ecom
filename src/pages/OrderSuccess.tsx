import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOrder } from '@/lib/api';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  CheckCircle,
  Download,
  Gift,
  Home,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les données depuis location.state (passées depuis Checkout)
  const { orderId, total, loyaltyPoints } = location.state || {};

  useEffect(() => {
    // Animation confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Charger les détails de la commande depuis l'API
    if (orderId) {
      loadOrderDetails();
    } else {
      // Si pas d'orderId, rediriger vers l'accueil
      navigate('/');
    }
  }, [orderId, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      // Utiliser les données du state si l'API échoue
      setOrder({
        id: orderId,
        total: total,
        loyaltyPointsEarned: loyaltyPoints,
        status: 'pending'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const downloadReceipt = () => {
    // Générer un reçu simple en texte
    const receipt = `
=================================
        REÇU DE COMMANDE
=================================

Commande N°: ${order.id}
Date: ${new Date().toLocaleDateString('fr-FR')}
Statut: En attente

${order.shippingAddress ? `
---------------------------------
ADRESSE DE LIVRAISON
---------------------------------
${order.shippingAddress.name}
${order.shippingAddress.phone}
${order.shippingAddress.address}
${order.shippingAddress.city}
` : ''}

${order.items ? `
---------------------------------
ARTICLES
---------------------------------
${order.items.map((item: any) => `
${item.name}
Quantité: ${item.quantity}
Prix: ${item.price.toFixed(2)} DH
Sous-total: ${(item.price * item.quantity).toFixed(2)} DH
`).join('\n')}
` : ''}

---------------------------------
TOTAL: ${(total || order.total).toFixed(2)} DH
---------------------------------

${loyaltyPoints || order.loyaltyPointsEarned ? `
Points de fidélité gagnés: ${loyaltyPoints || order.loyaltyPointsEarned}
` : ''}

Merci pour votre commande !
=================================
    `;

    const blob = new Blob([receipt], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `commande-${order.id}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête de succès */}
      <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-900 mb-2">
                Commande confirmée ! 🎉
              </h1>
              <p className="text-green-700">
                Merci pour votre achat. Votre commande a été enregistrée avec succès.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-base py-2 px-4">
                Commande N° <span className="font-mono ml-2">{order.id.substring(0, 8)}</span>
              </Badge>
              <Badge className="text-base py-2 px-4 bg-green-600">
                {(total || order.total)?.toFixed(2)} DH
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points de fidélité */}
      {(loyaltyPoints || order.loyaltyPointsEarned) && (
        <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-purple-100 p-3">
                <Gift className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900">Programme de fidélité</h3>
                <p className="text-purple-700">
                  <strong className="text-2xl">{loyaltyPoints || order.loyaltyPointsEarned}</strong> points ajoutés à votre compte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Informations de livraison */}
        {order.shippingAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse de livraison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{order.shippingAddress.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{order.shippingAddress.phone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{order.shippingAddress.address}</p>
                  <p className="text-muted-foreground">{order.shippingAddress.city}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statut de la commande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Statut de la commande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statut actuel</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                En attente
              </Badge>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Vous recevrez un email de confirmation avec le suivi de votre commande sous 24h.
            </p>
            <p className="text-sm text-muted-foreground">
              Livraison estimée : <strong>2-5 jours ouvrés</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Articles commandés */}
      {order.items && order.items.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Articles commandés ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item: any, index: number) => (
                <div key={index}>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      {item.image || item.product?.images?.[0] ? (
                        <img
                          src={item.image || item.product.images[0]}
                          alt={item.name || item.product?.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.name || item.product?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantité: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {((item.price || item.product?.price) * item.quantity).toFixed(2)} DH
                      </p>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={downloadReceipt}
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          Télécharger le reçu
        </Button>
        
        <Button
          onClick={() => navigate('/orders')}
          className="flex-1"
        >
          Voir mes commandes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex-1"
        >
          <Home className="mr-2 h-4 w-4" />
          Retour à l'accueil
        </Button>
      </div>

      {/* Informations supplémentaires */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            <strong>Besoin d'aide ?</strong> Contactez notre service client au +212 XXX XXX XXX 
            ou par email à support@votresite.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
