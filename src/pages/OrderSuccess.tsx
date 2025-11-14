// Improved OrderSuccess component with dark mode support and enhanced PDF layout

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getOrder } from "@/lib/api";
import confetti from "canvas-confetti";
import { jsPDF } from "jspdf";
import { ArrowRight, CheckCircle, Download, Home, Tag } from "lucide-react";
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
        finalTotal: total,
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

    // Boutique header
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Boutique Apple Phone", margin, y);
    doc.setFontSize(11);
    doc.text("Adresse: Guédiawaye", margin, y + 18);
    doc.text("Téléphone: 33 123 45 66 / 33 123 65 47", margin, y + 34);

    // Logo from public folder
    const logo = new Image();
    logo.src = "/logo.png"; // update name if needed
    await new Promise((res) => (logo.onload = res));
    doc.addImage(logo, "PNG", 450, margin - 10, 100, 60);
    y += 80;

    doc.setDrawColor(180);
    doc.line(margin, y, 555, y);
    y += 25;

    // Title
    doc.setFontSize(22);
    doc.text("REÇU DE COMMANDE", 297, y, { align: "center" });
    y += 40;

    // Order info
    doc.setFontSize(12);
    doc.text(`Commande N°: ${order.id}`, margin, y);
    y += 20;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, margin, y);
    y += 20;
    const statusLabel = order.status === "paid" ? "Payée" : order.status === "pending" ? "En attente" : "Annulée";
    doc.text(`Statut: ${statusLabel}`, margin, y);
    y += 30;

    // Address block
    if (order.shippingAddress) {
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, 515, 70, 5, 5, "F");
      doc.text(`Client: ${order.shippingAddress.name}`, margin + 10, y + 20);
      doc.text(`Téléphone: ${order.shippingAddress.phone}`, margin + 10, y + 35);
      doc.text(`Adresse: ${order.shippingAddress.address}, ${order.shippingAddress.city}`, margin + 10, y + 50);
      y += 90;
    }

    // Items header
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, 515, 25, "F");
    doc.text("Article", margin + 5, y + 17);
    doc.text("Quantité", margin + 250, y + 17);
    doc.text("Prix total", margin + 400, y + 17);
    y += 25;

    // Items list
    order.items?.forEach((item: any, index: number) => {
      doc.setFillColor(index % 2 === 0 ? 245 : 255, 245, index % 2 === 0 ? 245 : 255);
      doc.rect(margin, y, 515, 20, "F");
      const price = (item.price || item.product?.price) * item.quantity;
      doc.text(item.productName || item.product?.name, margin + 5, y + 15);
      doc.text(`${item.quantity}`, margin + 250, y + 15);
      doc.text(`${price.toFixed(2)} FCFA`, margin + 400, y + 15);
      y += 20;
    });

    y += 10;
    doc.text(`Sous-total: ${order.total.toFixed(2)} FCFA`, margin + 300, y);
    y += 20;

    if (order.discount && order.discount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Réduction (${order.voucherCode}): -${order.discount.toFixed(2)} FCFA`, margin + 300, y);
      doc.setTextColor(0, 0, 0);
      y += 20;
    }

    doc.setFillColor(220, 245, 220);
    doc.roundedRect(margin, y, 515, 30, 5, 5, "F");
    doc.setTextColor(0, 128, 0);
    doc.setFontSize(14);
    doc.text(`TOTAL: ${order.finalTotal.toFixed(2)} FCFA`, margin + 400, y + 20);
    doc.setTextColor(0, 0, 0);
    y += 60;

    const qrDataUrl = await QRCode.toDataURL(`${window.location.origin}/orders/${order.id}`);
    doc.addImage(qrDataUrl, "PNG", 440, y - 30, 100, 100);

    doc.save(`commande-${order.id}.pdf`);
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 text-gray-900 dark:text-gray-100">
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-300">Commande confirmée ! 🎉</h1>
          <p className="text-gray-600 dark:text-gray-300">Merci pour votre achat.</p>
          <Badge variant="outline" className="text-lg px-4 py-2 dark:border-gray-500">
            Commande N° {order.id.substring(0, 8)}
          </Badge>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Détails de la commande</h2>
          <Separator className="dark:bg-gray-600" />

          {order.items?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between py-2">
              <div className="flex-1">
                <p className="font-medium">{item.productName || item.product?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">Quantité: {item.quantity}</p>
              </div>
              <p className="font-semibold">{((item.price || item.product?.price) * item.quantity).toFixed(2)} FCFA</p>
            </div>
          ))}

          <Separator className="dark:bg-gray-600" />

          <div className="flex justify-between text-base">
            <span>Sous-total</span>
            <span>{order.total?.toFixed(2)} FCFA</span>
          </div>

          {order.discount && order.discount > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400 items-center">
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> Réduction ({order.voucherCode})
              </span>
              <span className="font-semibold">-{order.discount.toFixed(2)} FCFA</span>
            </div>
          )}

          <div className="flex justify-between text-xl font-bold pt-2 border-t-2 dark:border-gray-600">
            <span>Total</span>
            <span className="text-green-600 dark:text-green-400">{order.finalTotal?.toFixed(2)} FCFA</span>
          </div>

          {order.loyaltyPointsEarned > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-center">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Vous avez gagné <strong>{order.loyaltyPointsEarned} points</strong> ! 🎁
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={downloadReceipt} variant="outline" className="flex-1 dark:border-gray-600">
          <Download className="w-4 h-4 mr-2" /> Télécharger le reçu PDF
        </Button>
        <Button onClick={() => navigate("/orders")} className="flex-1">
          Voir mes commandes <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <Button onClick={() => navigate("/")} variant="ghost" className="w-full dark:text-gray-300">
        <Home className="w-4 h-4 mr-2" /> Retour à l'accueil
      </Button>
    </div>
  );
};

export default OrderSuccess;
