import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { getOrderPubic } from '@/lib/api';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Gift,
  Home,
  Loader2,
  MapPin,
  Package,
  Phone,
  Sparkles,
  Tag,
  Truck,
  User
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const { orderId, total, loyaltyPoints } = location.state || {};

  useEffect(() => {
    // Confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#16a34a', '#15803d'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#16a34a', '#15803d'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    if (orderId) {
      loadOrderDetails();
    } else {
      toast.error('Aucune commande trouvée');
      navigate('/');
    }
  }, [orderId, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getOrderPubic(orderId);
      setOrder(data);

      // Générer QR Code
      try {
        const qr = await QRCode.toDataURL(
          `${window.location.origin}/orders/${orderId}`,
          {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          }
        );
        setQrDataUrl(qr);
      } catch (e) {
        console.error('QR Code generation failed:', e);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      // Fallback avec données du state
      setOrder({
        id: orderId,
        total,
        finalTotal: total,
        loyaltyPointsEarned: loyaltyPoints || 0,
        status: 'pending',
        items: [],
        createdAt: new Date().toISOString(),
      });

      try {
        const qr = await QRCode.toDataURL(`${window.location.origin}/orders/${orderId}`);
        setQrDataUrl(qr);
      } catch (e) {
        console.error('QR Code generation failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!order) return;
    setDownloadingReceipt(true);

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const margin = 40;
      const pageWidth = 595;
      let y = margin;

      // Header avec logo
      try {
        const logo = await fetch('/logo.png')
          .then((r) => r.blob())
          .then((b) => URL.createObjectURL(b));
        doc.addImage(logo, 'PNG', margin, 20, 70, 70);
      } catch (e) {
        // Si pas de logo, continuer sans
      }

      // Infos boutique
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('BOUTIQUE APPLE PHONE', pageWidth - margin, 40, { align: 'right' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Guédiawaye, Dakar', pageWidth - margin, 60, { align: 'right' });
      doc.text('Tél: 33 123 45 66 / 33 123 65 47', pageWidth - margin, 75, {
        align: 'right',
      });

      y = 120;

      // Titre
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('REÇU DE COMMANDE', margin, y);
      y += 30;

      // Infos commande
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`N° de commande: ${order.id}`, margin, y);
      y += 18;
      doc.text(
        `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        margin,
        y
      );
      y += 18;
      doc.text(`Statut: ${getStatusLabel(order.status)}`, margin, y);
      y += 30;

      // Infos client
      if (order.shippingAddress) {
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, 90, 8, 8, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS CLIENT', margin + 10, y + 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nom: ${order.shippingAddress.name}`, margin + 10, y + 40);
        doc.text(`Téléphone: ${order.shippingAddress.phone}`, margin + 10, y + 55);
        doc.text(
          `Adresse: ${order.shippingAddress.address}, ${order.shippingAddress.city}`,
          margin + 10,
          y + 70
        );
        y += 110;
      }

      // Articles
      if (order.items?.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ARTICLES COMMANDÉS', margin, y);
        y += 20;

        // En-tête tableau
        doc.setFillColor(34, 197, 94);
        doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Article', margin + 10, y + 16);
        doc.text('Qté', margin + 320, y + 16);
        doc.text('Prix unitaire', margin + 380, y + 16);
        doc.text('Total', pageWidth - margin - 10, y + 16, { align: 'right' });
        y += 30;

        // Lignes articles
        doc.setTextColor(0, 0, 0);
        order.items.forEach((item: any, index: number) => {
          doc.setFillColor(index % 2 ? 255 : 250, 250, 250);
          doc.rect(margin, y, pageWidth - 2 * margin, 25, 'F');

          doc.setFont('helvetica', 'normal');
          const maxWidth = 300;
          const name =
            doc.getTextWidth(item.productName) > maxWidth
              ? item.productName.substring(0, 35) + '...'
              : item.productName;

          doc.text(name, margin + 10, y + 16);
          doc.text(String(item.quantity), margin + 320, y + 16);
          doc.text(`${item.price.toLocaleString('fr-FR')} FCFA`, margin + 380, y + 16);
          doc.setFont('helvetica', 'bold');
          doc.text(
            `${(item.price * item.quantity).toLocaleString('fr-FR')} FCFA`,
            pageWidth - margin - 10,
            y + 16,
            { align: 'right' }
          );
          y += 25;
        });
        y += 15;
      }

      // Totaux
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('Sous-total:', pageWidth - margin - 120, y);
      doc.text(`${order.total?.toLocaleString('fr-FR')} FCFA`, pageWidth - margin - 10, y, {
        align: 'right',
      });
      y += 20;

      if (order.discount > 0) {
        doc.setTextColor(34, 197, 94);
        doc.text('Réduction:', pageWidth - margin - 120, y);
        doc.text(
          `-${order.discount.toLocaleString('fr-FR')} FCFA`,
          pageWidth - margin - 10,
          y,
          { align: 'right' }
        );
        y += 20;
        doc.setTextColor(0, 0, 0);
      }

      // Total final
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(margin, y, pageWidth - 2 * margin, 40, 8, 8, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('TOTAL À PAYER:', margin + 10, y + 25);
      doc.text(
        `${order.finalTotal?.toLocaleString('fr-FR')} FCFA`,
        pageWidth - margin - 10,
        y + 25,
        { align: 'right' }
      );
      y += 60;

      // QR Code
      if (qrDataUrl) {
        const qrSize = 120;
        doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - qrSize, y, qrSize, qrSize);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('Scannez pour suivre', pageWidth - margin - qrSize / 2, y + qrSize + 15, {
          align: 'center',
        });
      }

      // Footer
      y = 800;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 15;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Merci pour votre confiance !', pageWidth / 2, y, { align: 'center' });
      doc.text(
        'Pour toute question, contactez-nous au 33 123 45 66',
        pageWidth / 2,
        y + 15,
        { align: 'center' }
      );

      doc.save(`commande-${order.id}.pdf`);
      toast.success('Reçu téléchargé avec succès !');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du reçu');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const downloadMiniReceipt = async () => {
    if (!order) return;
    setDownloadingReceipt(true);

    try {
      const widthPt = 227;
      const heightPt = Math.max(450, 250 + (order.items?.length || 0) * 30);
      const doc = new jsPDF({ unit: 'pt', format: [widthPt, heightPt] });

      const margin = 10;
      let y = margin + 10;

      // Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('APPLE PHONE', widthPt / 2, y, { align: 'center' });
      y += 15;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Guédiawaye - Tel: 33 123 45 66', widthPt / 2, y, { align: 'center' });
      y += 18;

      doc.setLineWidth(0.5);
      doc.line(margin, y, widthPt - margin, y);
      y += 12;

      // Infos commande
      doc.setFontSize(8);
      doc.text(`N°: ${order.id.substring(0, 12)}...`, margin, y);
      y += 12;
      doc.text(
        `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}`,
        margin,
        y
      );
      y += 15;

      // Client
      if (order.shippingAddress) {
        doc.setFontSize(7);
        doc.text(`Client: ${order.shippingAddress.name}`, margin, y);
        y += 10;
        doc.text(`Tel: ${order.shippingAddress.phone}`, margin, y);
        y += 10;
        doc.text(
          `${order.shippingAddress.city || ''}`.substring(0, 30),
          margin,
          y
        );
        y += 15;
      }

      doc.line(margin, y, widthPt - margin, y);
      y += 10;

      // Articles
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('ARTICLES', margin, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      (order.items || []).forEach((item: any) => {
        const name =
          item.productName.length > 25
            ? item.productName.substring(0, 25) + '...'
            : item.productName;
        doc.text(`${name} x${item.quantity}`, margin, y);
        doc.text(
          `${(item.price * item.quantity).toLocaleString('fr-FR')}`,
          widthPt - margin,
          y,
          { align: 'right' }
        );
        y += 12;
      });

      y += 5;
      doc.line(margin, y, widthPt - margin, y);
      y += 10;

      // Totaux
      doc.text(`Sous-total:`, margin, y);
      doc.text(`${order.total?.toLocaleString('fr-FR')}`, widthPt - margin, y, {
        align: 'right',
      });
      y += 12;

      if (order.discount > 0) {
        doc.text(`Réduction:`, margin, y);
        doc.text(`-${order.discount.toLocaleString('fr-FR')}`, widthPt - margin, y, {
          align: 'right',
        });
        y += 12;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`TOTAL:`, margin, y);
      doc.text(
        `${order.finalTotal?.toLocaleString('fr-FR')} FCFA`,
        widthPt - margin,
        y,
        { align: 'right' }
      );
      y += 20;

      // QR Code
      if (qrDataUrl) {
        const size = 100;
        const x = (widthPt - size) / 2;
        doc.addImage(qrDataUrl, 'PNG', x, y, size, size);
        y += size + 10;
      }

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('Merci pour votre achat !', widthPt / 2, y, { align: 'center' });

      doc.save(`mini-commande-${order.id}.pdf`);
      toast.success('Reçu compact téléchargé !');
    } catch (error) {
      console.error('Error generating mini receipt:', error);
      toast.error('Erreur lors de la génération du reçu');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardContent>
        </Card>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen  py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 space-y-6"
      >
        {/* Success Card */}
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-green-500 mx-auto"
            >
              <CheckCircle className="w-16 h-16 text-white" />
            </motion.div>

            <div>
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                Commande confirmée ! 🎉
              </h1>
              <p className="text-gray-600 text-lg">
                Merci pour votre confiance. Votre commande a été enregistrée avec succès.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-700">N° de commande:</span>
              </div>
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 bg-white border-green-300"
              >
                {order.id.substring(0, 12)}...
              </Badge>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getStatusColor(
                order.status
              )}`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{getStatusLabel(order.status)}</span>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        {qrDataUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Card className="inline-block">
              <CardContent className="p-6">
                <img
                  src={qrDataUrl}
                  alt="QR Code commande"
                  className="w-40 h-40 mx-auto rounded-lg"
                />
                <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Scannez pour suivre votre commande
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alert pour utilisateurs non connectés */}
        {!user && (
          <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
            <Gift className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900 flex items-center gap-2 flex-wrap">
              <strong>Créez un compte</strong> pour suivre vos commandes et gagner des points
              de fidélité !
              <Link
                to="/auth"
                className="underline font-semibold hover:text-blue-700 flex items-center gap-1"
              >
                S'inscrire
                <ArrowRight className="h-3 w-3" />
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Détails commande */}
        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Détails de la commande
              </h2>
              {order.createdAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Adresse de livraison */}
            {order.shippingAddress && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Adresse de livraison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shippingAddress.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {order.shippingAddress.address}, {order.shippingAddress.city}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Articles */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Articles commandés</h3>
                {order.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantité: {item.quantity} × {item.price.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                    <p className="text-lg font-bold">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Totaux */}
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">
                  {order.total?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-lg text-green-600">
                  <span className="flex items-center gap-2">
                    <Tag className="w-5 h-5" /> Réduction
                  </span>
                  <span className="font-bold">
                    -{order.discount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold">Total</span>
                <span className="text-3xl font-bold text-green-600">
                  {order.finalTotal?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Points de fidélité */}
            {user && order.loyaltyPointsEarned > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 p-4 rounded-xl">
                <div className="flex items-center justify-center gap-3 text-orange-900">
                  <Gift className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">Points de fidélité gagnés</p>
                    <p className="text-2xl font-bold">{order.loyaltyPointsEarned} points</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={downloadReceipt}
            variant="outline"
            size="lg"
            disabled={downloadingReceipt}
            className="h-14"
          >
            {downloadingReceipt ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Télécharger le reçu
          </Button>

          <Button
            onClick={downloadMiniReceipt}
            variant="outline"
            size="lg"
            disabled={downloadingReceipt}
            className="h-14"
          >
            <Download className="w-5 h-5 mr-2" />
            Reçu compact
          </Button>

          {user && (
            <Button
              onClick={() => navigate('/orders')}
              size="lg"
              className="h-14 md:col-span-2"
            >
              Voir mes commandes
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="lg"
          className="w-full h-12"
        >
          <Home className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Button>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
