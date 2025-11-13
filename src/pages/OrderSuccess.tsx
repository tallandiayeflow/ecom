import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOrder } from "@/lib/api";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { ArrowRight, CheckCircle, Download, Home } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { orderId, total, loyaltyPoints } = location.state || {};

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    if (orderId) loadOrderDetails();
    else navigate("/");
  }, [orderId, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch {
      setOrder({
        id: orderId,
        total: total,
        loyaltyPointsEarned: loyaltyPoints,
        status: "pending",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!order) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const margin = 40;
    let y = margin;

    // Header
    doc.setFillColor(0, 123, 255);
    doc.rect(0, 0, 595, 70, "F");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("REÇU DE COMMANDE", 297, 45, { align: "center" });
    y += 90;

    // Commande info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Commande N°: ${order.id}`, margin, y);
    y += 20;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
    y += 20;
    const statusLabel =
      order.status === "paid"
        ? "Payée"
        : order.status === "pending"
        ? "En attente"
        : "Annulée";
    doc.text(`Statut: ${statusLabel}`, margin, y);
    y += 30;

    // Client info
    if (order.shippingAddress) {
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, 515, 70, 5, 5, "F");
      doc.setTextColor(0, 0, 0);
      doc.text(`Client: ${order.shippingAddress.name}`, margin + 10, y + 20);
      doc.text(`Téléphone: ${order.shippingAddress.phone}`, margin + 10, y + 35);
      doc.text(
        `Adresse: ${order.shippingAddress.address}, ${order.shippingAddress.city}`,
        margin + 10,
        y + 50
      );
      y += 90;
    }

    // Articles table header
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, 515, 25, "F");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Article", margin + 5, y + 17);
    doc.text("Quantité", margin + 250, y + 17);
    doc.text("Prix total", margin + 400, y + 17);
    y += 25;

    // Articles rows with alternating colors
    order.items.forEach((item: any, index: number) => {
      if (index % 2 === 0) doc.setFillColor(245, 245, 245);
      else doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, 515, 20, "F");

      const price = (item.price || item.product?.price) * item.quantity;
      doc.setTextColor(0, 0, 0);
      doc.text(item.productName || item.product?.name, margin + 5, y + 15);
      doc.text(`${item.quantity}`, margin + 250, y + 15);
      doc.text(`${price.toFixed(2)} FCFA`, margin + 400, y + 15);
      y += 20;
    });

    y += 10;
    // Total encadré
    doc.setFillColor(220, 245, 220);
    doc.roundedRect(margin, y, 515, 30, 5, 5, "F");
    doc.setTextColor(0, 128, 0);
    doc.setFontSize(14);
    doc.text(
      `TOTAL: ${(order.total || total).toFixed(2)} FCFA`,
      margin + 400,
      y + 20
    );
    y += 50;

    // QR Code on the bottom-right
    const qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/orders/${order.id}`);
    doc.addImage(qrDataUrl, "PNG", 440, y - 30, 100, 100);

    doc.save(`commande-${order.id}.pdf`);
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  if (!order) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h1 className="text-3xl font-bold text-green-900 mb-2">Commande confirmée ! 🎉</h1>
          <p className="text-green-700">Merci pour votre achat. Votre commande a été enregistrée avec succès.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <Badge variant="outline" className="text-base py-2 px-4">
              Commande N° <span className="font-mono ml-2">{order.id.substring(0, 8)}</span>
            </Badge>
            <Badge className="text-base py-2 px-4 bg-green-600">{(total || order.total)?.toFixed(2)} FCFA</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button variant="outline" onClick={downloadReceipt} className="flex-1 flex items-center justify-center gap-2">
          <Download /> Télécharger le reçu PDF
        </Button>
        <Button onClick={() => navigate("/orders")} className="flex-1 flex items-center justify-center gap-2">
          <ArrowRight /> Voir mes commandes
        </Button>
        <Button variant="outline" onClick={() => navigate("/")} className="flex-1 flex items-center justify-center gap-2">
          <Home /> Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
