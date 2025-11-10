import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Download, Home } from 'lucide-react';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order, qrCode } = location.state || {};

  useEffect(() => {
    if (!order) {
      navigate('/');
    }
  }, [order, navigate]);

  if (!order) return null;

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `order-${order.id}.png`;
    link.href = qrCode;
    link.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <CardTitle className="text-3xl">Commande confirmée !</CardTitle>
          <p className="text-muted-foreground">
            Merci pour votre achat. Votre commande a été enregistrée avec succès.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Numéro de commande</span>
              <Badge variant="outline" className="text-base">
                {order.id}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Montant total</span>
              <span className="text-2xl font-bold text-primary">
                {order.finalTotal.toFixed(2)}€
              </span>
            </div>
          </div>

          <Separator />

          {/* QR Code */}
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Votre QR Code de commande</h3>
            <p className="text-sm text-muted-foreground">
              Présentez ce code lors de la réception de votre commande
            </p>
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>
            <Button onClick={downloadQRCode} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Télécharger le QR Code
            </Button>
          </div>

          <Separator />

          {/* Loyalty Points */}
          <div className="p-4 bg-gradient-primary text-primary-foreground rounded-lg text-center">
            <div className="text-3xl font-bold mb-2">
              🎉 +{order.loyaltyPointsEarned} points
            </div>
            <p className="text-sm opacity-90">
              Points de fidélité ajoutés à votre compte
            </p>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="font-semibold mb-2">Adresse de livraison</h3>
            <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}</p>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-2">Produits commandés</h3>
            <div className="space-y-2">
              {order.items.map((item: any) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-16 w-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantité: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {(item.product.price * item.quantity).toFixed(2)}€
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={() => navigate('/')} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
            <Button onClick={() => navigate('/orders')} variant="outline" className="flex-1">
              Mes commandes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
