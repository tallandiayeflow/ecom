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
  User,
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

      if (Date.now() < end) requestAnimationFrame(frame);
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

      try {
        const qr = await QRCode.toDataURL(
          `${window.location.origin}/orders/${orderId}`,
          {
            width: 256,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          },
        );
        setQrDataUrl(qr);
      } catch (e) {
        console.error('QR Code generation failed:', e);
      }
    } catch (error) {
      console.error('Error loading order:', error);
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

  /* ================= MINI THERMAL RECEIPT (SEUL REÇU) ================= */

  const formatNumber = (num: number): string => {
    return Math.round(num)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const downloadMiniReceipt = async () => {
    if (!order) return;
    setDownloadingReceipt(true);

    try {
      const widthPt = 227; // ~80mm
      const lineHeight = 10;
      const margin = 10;
      let y = margin + 10;

      // hauteur dynamique
      const itemsCount = order.items?.length || 0;
      const baseHeight = 220 + itemsCount * 18;
      const heightPt = Math.max(360, baseHeight);

      const doc = new jsPDF({ unit: 'pt', format: [widthPt, heightPt] });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('APPLE PHONE', widthPt / 2, y, { align: 'center' });
      y += 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Guédiawaye - Tel: 33 123 45 66', widthPt / 2, y, { align: 'center' });
      y += 16;

      doc.setLineWidth(0.5);
      doc.line(margin, y, widthPt - margin, y);
      y += 8;

      doc.text(`N°: ${String(order.id).slice(0, 16)}...`, margin, y);
      y += lineHeight;
      doc.text(
        `Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('fr-FR')}`,
        margin,
        y,
      );
      y += lineHeight + 2;

      if (order.shippingAddress) {
        doc.setFontSize(7);
        doc.text(`Client: ${order.shippingAddress.name}`, margin, y);
        y += lineHeight;
        doc.text(`Tel: ${order.shippingAddress.phone}`, margin, y);
        y += lineHeight;
        const adr = `${order.shippingAddress.city || ''}`.trim();
        if (adr) {
          doc.text(adr, margin, y);
          y += lineHeight;
        }
        y += 2;
      }

      doc.line(margin, y, widthPt - margin, y);
      y += lineHeight;

      // Articles
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('ARTICLES', margin, y);
      y += lineHeight;

      doc.setFont('helvetica', 'normal');
      (order.items || []).forEach((item: any) => {
        const name =
          item.productName.length > 24
            ? item.productName.slice(0, 24) + '…'
            : item.productName;
        const line = `${name} x${item.quantity}`;
        const total = formatNumber(item.price * item.quantity);

        doc.text(line, margin, y);
        doc.text(total, widthPt - margin, y, { align: 'right' });
        y += lineHeight;
      });

      y += 4;
      doc.line(margin, y, widthPt - margin, y);
      y += lineHeight;

      // Totaux
      const totalText = formatNumber(order.total || 0);
      doc.text('Sous-total:', margin, y);
      doc.text(totalText, widthPt - margin, y, { align: 'right' });
      y += lineHeight;

      if (order.discount > 0) {
        const discText = formatNumber(order.discount);
        doc.text('Réduction:', margin, y);
        doc.text(`-${discText}`, widthPt - margin, y, { align: 'right' });
        y += lineHeight;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const finalText = formatNumber(order.finalTotal || order.total || 0);
      doc.text('TOTAL:', margin, y);
      doc.text(`${finalText} FCFA`, widthPt - margin, y, { align: 'right' });
      y += lineHeight + 4;

      // QR
      if (qrDataUrl) {
        const size = 90;
        const x = (widthPt - size) / 2;
        doc.addImage(qrDataUrl, 'PNG', x, y, size, size);
        y += size + 6;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('Merci pour votre achat !', widthPt / 2, y, { align: 'center' });

      doc.save(`commande-${order.id}.pdf`);
      toast.success('Reçu téléchargé avec succès !');
    } catch (error) {
      console.error('Error generating receipt:', error);
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

  /* ============== UI REACT ============== */

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
    <div className="min-h-screen py-10 bg-gradient-to-br from-green-50 via-emerald-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 space-y-6"
      >
        {/* Success card */}
        <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-2xl">
          <CardContent className="p-6 sm:p-8 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="inline-flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-green-500 mx-auto"
            >
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            </motion.div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-1">
                Commande confirmée ! 🎉
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Merci pour votre confiance. Votre commande a été enregistrée avec succès.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-gray-700 text-sm">
                  N° de commande :
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-base px-3 py-1 bg-white border-green-300"
              >
                {String(order.id).substring(0, 12)}…
              </Badge>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${getStatusColor(
                order.status,
              )}`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-semibold text-sm">
                {getStatusLabel(order.status)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* QR */}
        {qrDataUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <Card className="inline-block">
              <CardContent className="p-4 sm:p-6">
                <img
                  src={qrDataUrl}
                  alt="QR Code commande"
                  className="w-32 h-32 sm:w-40 sm:h-40 mx-auto rounded-lg bg-white p-1"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  Scannez pour suivre votre commande
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Alert invité */}
        {!user && (
          <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
            <Gift className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900 flex items-center gap-2 flex-wrap text-sm">
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

        {/* Détails */}
        <Card className="shadow-xl">
          <CardContent className="p-5 sm:p-6 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                Détails de la commande
              </h2>
              {order.createdAt && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Adresse */}
            {order.shippingAddress && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-primary" />
                  Adresse de livraison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{order.shippingAddress.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{order.shippingAddress.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
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
                <h3 className="font-semibold text-base sm:text-lg">Articles commandés</h3>
                {order.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base">
                        {item.productName}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Quantité : {item.quantity} ×{' '}
                        {item.price.toLocaleString('fr-FR')} FCFA
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {item.selectedColor && (
                          <span className="text-xs text-muted-foreground mr-2">
                            Couleur: {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="text-xs text-muted-foreground">
                            Taille: {item.selectedSize}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-sm sm:text-lg font-bold">
                      {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Totaux */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm sm:text-lg">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">
                  {order.total?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-sm sm:text-lg text-green-600">
                  <span className="flex items-center gap-2">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5" /> Réduction
                  </span>
                  <span className="font-bold">
                    -{order.discount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-baseline">
                <span className="text-lg sm:text-2xl font-bold">Total</span>
                <span className="text-2xl sm:text-3xl font-bold text-green-600">
                  {order.finalTotal?.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {/* Points fidélité */}
            {user && order.loyaltyPointsEarned > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 p-3 sm:p-4 rounded-xl">
                <div className="flex items-center justify-center gap-3 text-orange-900">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      Points de fidélité gagnés
                    </p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {order.loyaltyPointsEarned} points
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <Button
            onClick={downloadMiniReceipt}
            size="lg"
            disabled={downloadingReceipt}
            className="h-12 sm:h-14 text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {downloadingReceipt ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Télécharger le reçu
          </Button>

          {user && (
            <Button
              onClick={() => navigate('/orders')}
              size="lg"
              className="h-12 sm:h-14 md:col-span-2 text-sm sm:text-base"
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
          className="w-full h-11 sm:h-12"
        >
          <Home className="w-5 h-5 mr-2" />
          Retour à l'accueil
        </Button>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
