import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderPubic } from "@/lib/api";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { ArrowRight, CheckCircle, Download, Gift, Home, Info, Tag } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const { orderId, total, loyaltyPoints } = location.state || {};

  useEffect(() => {
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    if (orderId) loadOrderDetails();
    else navigate("/");
  }, [orderId, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getOrderPubic(orderId);
      setOrder(data);
      try {
        const qr = await QRCode.toDataURL(`${window.location.origin}/orders/${orderId}`);
        setQrDataUrl(qr);
      } catch (e) {
        setQrDataUrl(null);
      }
    } catch {
      setOrder({ id: orderId, total, finalTotal: total, loyaltyPointsEarned: loyaltyPoints || 0, status: "pending" });
      try {
        const qr = await QRCode.toDataURL(`${window.location.origin}/orders/${orderId}`);
        setQrDataUrl(qr);
      } catch (e) {
        setQrDataUrl(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!order) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const margin = 40;
    let y = margin;

    // Header avec logo et infos boutique
    const logo = await fetch('/logo.png').then(r => r.blob()).then(b => URL.createObjectURL(b));
    doc.addImage(logo, "PNG", margin, 20, 70, 70);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Boutique Apple Phone", 450, 40, { align: "right" });
    doc.text("Adresse : Guédiawaye", 450, 60, { align: "right" });
    doc.text("Téléphone : 33 123 45 66 / 33 123 65 47", 450, 80, { align: "right" });

    y = 120;

    // Infos principales
    doc.setFontSize(14);
    doc.setTextColor(33, 33, 33);
    doc.text(`Commande: ${order.id}`, margin, y);
    y += 22;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
    y += 22;

    // Client
    if (order.shippingAddress) {
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, 515, 80, 8, 8, "F");
      doc.text(`Client: ${order.shippingAddress.name}`, margin + 10, y + 25);
      doc.text(`Téléphone: ${order.shippingAddress.phone}`, margin + 10, y + 45);
      doc.text(`Adresse: ${order.shippingAddress.address}, ${order.shippingAddress.city}`, margin + 10, y + 65);
      y += 100;
    }

    // Articles
    if (order.items?.length > 0) {
      doc.setFontSize(12);
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, y, 515, 25, "F");
      doc.text("Articles", margin + 5, y + 17);
      doc.text("Qté", margin + 250, y + 17);
      doc.text("Total", margin + 400, y + 17);
      y += 30;

      order.items.forEach((item: any, index: number) => {
        doc.setFillColor(index % 2 ? 255 : 245, 245, 245);
        doc.rect(margin, y, 515, 22, "F");
        doc.setTextColor(0, 0, 0);
        doc.text(item.productName, margin + 5, y + 15);
        doc.text(String(item.quantity), margin + 250, y + 15);
        doc.text(`${(item.price * item.quantity).toFixed(2)} FCFA`, margin + 400, y + 15);
        y += 22;
      });
      y += 10;
    }

    // Totaux
    doc.text(`Sous-total: ${order.total.toFixed(2)} FCFA`, margin + 300, y);
    y += 20;

    if (order.discount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Réduction: -${order.discount.toFixed(2)} FCFA`, margin + 300, y);
      y += 20;
    }

    doc.setFillColor(220, 245, 220);
    doc.roundedRect(margin, y, 515, 35, 8, 8, "F");
    doc.setFontSize(16);
    doc.setTextColor(0, 128, 0);
    doc.text(`TOTAL: ${order.finalTotal.toFixed(2)} FCFA`, margin + 370, y + 23);
    y += 60;

    // QR Code
    const qr = await QRCode.toDataURL(`${window.location.origin}/orders/${order.id}`);
    doc.addImage(qr, "PNG", 440, y - 20, 110, 110);

    // Save
    doc.save(`commande-${order.id}.pdf`);
  };

  const downloadMiniReceipt = async () => {
    if (!order) return;
    // Thermal/mini receipt ~80mm width (~227pt). Height is flexible based on items.
    const widthPt = 227;
    const heightPt = Math.max(400, 200 + (order.items?.length || 0) * 28);
    const doc = new jsPDF({ unit: "pt", format: [widthPt, heightPt] });

    const margin = 8;
    let y = margin;

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("BOUTIQUE APPLE PHONE", widthPt / 2, y + 12, { align: "center" });
    y += 20;
    doc.setFontSize(9);
    doc.text("Guédiawaye - Tel: 33 123 45 66", widthPt / 2, y + 10, { align: "center" });
    y += 18;

    doc.setLineWidth(0.5);
    doc.line(margin, y, widthPt - margin, y);
    y += 10;

    doc.setFontSize(9);
    doc.text(`Commande: ${order.id}`, margin, y);
    y += 12;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
    y += 14;

    if (order.shippingAddress) {
      doc.setFontSize(8);
      doc.text(`Client: ${order.shippingAddress.name}`, margin, y);
      y += 12;
      doc.text(`${order.shippingAddress.address || ""} ${order.shippingAddress.city || ""}`, margin, y);
      y += 14;
    }

    doc.setFontSize(9);
    doc.text("--- Articles ---", margin, y);
    y += 12;

    (order.items || []).forEach((item: any) => {
      const left = `${item.productName} x${item.quantity}`;
      doc.text(left, margin, y);
      doc.text(`${(item.price * item.quantity).toFixed(2)} FCFA`, widthPt - margin, y, { align: "right" });
      y += 12;
    });

    y += 6;
    doc.line(margin, y, widthPt - margin, y);
    y += 10;

    doc.text(`Sous-total: ${order.total?.toFixed(2)} FCFA`, margin, y);
    y += 12;
    if (order.discount > 0) {
      doc.text(`Réduction: -${order.discount.toFixed(2)} FCFA`, margin, y);
      y += 12;
    }

    doc.setFontSize(11);
    doc.text(`TOTAL: ${order.finalTotal?.toFixed(2)} FCFA`, margin, y);
    y += 18;

    try {
      const qr = qrDataUrl || (await QRCode.toDataURL(`${window.location.origin}/orders/${order.id}`));
      if (qr) {
        const size = 120;
        const x = (widthPt - size) / 2;
        doc.addImage(qr, "PNG", x, y, size, size);
        y += size + 8;
      }
    } catch (e) {
      // ignore QR failure
    }

    doc.setFontSize(8);
    doc.text("Merci pour votre achat !", widthPt / 2, y + 6, { align: "center" });

    doc.save(`mini-commande-${order.id}.pdf`);
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;
  if (!order) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto p-4 space-y-6">
      <Card className="border-green-300 bg-green-50 shadow-md">
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
          <h1 className="text-3xl font-bold text-green-800">Commande réussie 🎉</h1>
          <p className="text-gray-600 text-lg">Merci pour votre commande ! Elle a bien été enregistrée.</p>
          <Badge variant="outline" className="text-xl px-4 py-2 rounded-xl">
            N° {order.id.substring(0, 8)}
          </Badge>
        </CardContent>
      </Card>

      {qrDataUrl && (
        <div className="text-center">
          <img src={qrDataUrl} alt="QR Code commande" className="w-36 h-36 mx-auto rounded-md bg-white p-2" />
          <p className="text-sm text-gray-600 mt-2">Scannez pour voir votre commande</p>
        </div>
      )}

      {!user && (
        <Alert className="bg-blue-50 border-blue-300 shadow-sm">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Astuce :</strong> <Link to="/auth" className="underline font-semibold">Crééz un compte</Link> pour suivre vos commandes et gagner vos points.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Détails de la commande</h2>
          <Separator />

          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-semibold">{item.productName}</p>
                <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
              </div>
              <p className="text-lg font-bold">{(item.price * item.quantity).toFixed(2)} FCFA</p>
            </div>
          ))}

          <div className="flex justify-between text-lg mt-4">
            <span>Sous-total</span>
            <span>{order.total?.toFixed(2)} FCFA</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-green-600 text-lg">
              <span className="flex items-center gap-2"><Tag className="w-5 h-5" /> Réduction</span>
              <span>-{order.discount.toFixed(2)} FCFA</span>
            </div>
          )}

          <div className="flex justify-between text-2xl font-bold pt-4 border-t">
            <span>Total</span>
            <span className="text-green-700">{order.finalTotal?.toFixed(2)} FCFA</span>
          </div>

          {user && order.loyaltyPointsEarned > 0 && (
            <div className="bg-blue-50 p-4 rounded-xl text-center text-blue-800 font-medium">
              Vous gagnez <strong>{order.loyaltyPointsEarned} points</strong> ! <Gift className="inline w-5 h-5" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={downloadReceipt} variant="outline" className="flex-1 text-lg py-6 rounded-xl">
          <Download className="w-5 h-5 mr-2" /> Télécharger le reçu
        </Button>
        <Button onClick={downloadMiniReceipt} variant="ghost" className="flex-1 text-lg py-6 rounded-xl">
          <Download className="w-5 h-5 mr-2" /> Télécharger reçu compact
        </Button>
        {user && (
          <Button onClick={() => navigate("/orders")} className="flex-1 text-lg py-6 rounded-xl">
            Voir mes commandes <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>

      <Button onClick={() => navigate("/")} variant="ghost" className="w-full text-lg py-4">
        <Home className="w-5 h-5 mr-2" /> Retour à l'accueil
      </Button>
    </motion.div>
  );
};

export default OrderSuccess;
