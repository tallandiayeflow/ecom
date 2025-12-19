"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { factures } from "@/lib/api";
import type { Invoice } from "@/types/invoices";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  Share2,
  User,
  XCircle,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const SHOP_INFO = {
  name: "Teuss Phone Shop",
  address: "Casablanca, Maroc",
  phone: "+212 6XX XXX XXX",
  email: "contact@teussphone.com",
  ice: "ICE000000000",
  logo: "/logo.png",
  website: "www.teussphone.com",
};

const statusConfig = {
  paid: {
    label: "Payée",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  pending: {
    label: "En attente",
    icon: AlertCircle,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

const InvoicePDF = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadInvoice(id);
  }, [id]);

  useEffect(() => {
    if (invoice) {
      const url = `${window.location.origin}/invoices/${invoice.id}`;
      QRCode.toDataURL(url, { width: 150, margin: 1 })
        .then(setQr)
        .catch(() => toast.error("Erreur lors de la génération du QR code"));
    }
  }, [invoice]);

  const loadInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      const data = await factures.getInvoice(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement de la facture");
      navigate("/admin/invoices");
    } finally {
      setLoading(false);
    }
  };

  // Impression thermique optimisée (format ticket 80mm)
  const handlePrintThermal = () => {
    if (!invoice) return;
    setPrinting(true);

    const win = window.open("", "_blank", "width=300,height=600");
    if (!win) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression");
      setPrinting(false);
      return;
    }

    const thermalContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reçu ${invoice.invoice_number}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.4;
            padding: 8px;
            width: 80mm;
            max-width: 80mm;
            background: #fff;
            color: #000;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px dashed #000;
          }
          .shop-name {
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .shop-info {
            font-size: 10px;
            line-height: 1.3;
          }
          .receipt-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
            margin: 12px 0;
            letter-spacing: 1px;
          }
          .section {
            margin-bottom: 10px;
            font-size: 10px;
          }
          .line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin: 10px 0;
          }
          .item-row {
            margin-bottom: 8px;
          }
          .item-name {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .totals {
            margin-top: 8px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;
          }
          .total-final {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            padding-top: 6px;
            margin-top: 6px;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            font-size: 10px;
          }
          .qr-container {
            text-align: center;
            margin: 12px 0;
          }
          .bold { font-weight: bold; }
          @media print {
            body {
              margin: 0;
              padding: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${SHOP_INFO.name}</div>
          <div class="shop-info">
            ${SHOP_INFO.address}<br/>
            Tel: ${SHOP_INFO.phone}<br/>
            ${SHOP_INFO.email}<br/>
            ICE: ${SHOP_INFO.ice}
          </div>
        </div>

        <div class="receipt-title">REÇU DE VENTE</div>

        <div class="section">
          <div class="line">
            <span>N° Facture:</span>
            <span class="bold">${invoice.invoice_number}</span>
          </div>
          <div class="line">
            <span>Date:</span>
            <span>${new Date(invoice.created_at).toLocaleString("fr-FR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>
          <div class="line">
            <span>Client:</span>
            <span class="bold">${invoice.customer_name}</span>
          </div>
          ${
            invoice.customer_phone
              ? `<div class="line"><span>Tel:</span><span>${invoice.customer_phone}</span></div>`
              : ""
          }
          ${
            invoice.customer_address
              ? `<div class="line"><span>Adresse:</span><span>${invoice.customer_address}</span></div>`
              : ""
          }
        </div>

        <div class="items">
          ${invoice.items
            ?.map(
              (item) => `
            <div class="item-row">
              <div class="item-name">${item.product_name}</div>
              <div class="line">
                <span>${item.quantity} x ${Number(item.unit_price || 0).toFixed(2)} FCFA</span>
                <span class="bold">${Number(item.total || 0).toFixed(2)} FCFA</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="totals">
          <div class="total-line">
            <span>Sous-total HT:</span>
            <span>${Number(invoice.amount || 0).toFixed(2)} FCFA</span>
          </div>
          ${
            invoice.discount && invoice.discount > 0
              ? `<div class="total-line">
            <span>Remise:</span>
            <span>-${Number(invoice.discount).toFixed(2)} FCFA</span>
          </div>`
              : ""
          }
          <div class="total-line">
            <span>TVA (${invoice.tax_rate || 0}%):</span>
            <span>${Number(invoice.tax || 0).toFixed(2)} FCFA</span>
          </div>
          <div class="total-line total-final">
            <span>TOTAL TTC:</span>
            <span>${Number(invoice.total || 0).toFixed(2)} FCFA</span>
          </div>
        </div>

        <div class="footer">
          <div style="margin-bottom: 8px;">
            <strong>Merci pour votre achat!</strong>
          </div>
          <div>
            Garantie: 3 mois<br/>
            Conservez ce reçu
          </div>
        </div>

        ${
          qr
            ? `<div class="qr-container">
          <img src="${qr}" alt="QR Code" width="100" height="100" style="display: block; margin: 0 auto;" />
        </div>`
            : ""
        }
      </body>
      </html>
    `;

    win.document.write(thermalContent);
    win.document.close();

    win.onload = () => {
      setTimeout(() => {
        win.print();
        setPrinting(false);
      }, 250);
    };
  };

  // Téléchargement PDF A4
  const handleDownloadPDF = async () => {
    if (!printRef.current || !invoice) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Facture_${invoice.invoice_number}.pdf`);
      toast.success("PDF téléchargé avec succès ! 📄");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la création du PDF");
    } finally {
      setDownloading(false);
    }
  };

  // Partage
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Facture ${invoice?.invoice_number}`,
          text: `Facture ${invoice?.invoice_number} - ${invoice?.customer_name}`,
          url: url,
        });
        toast.success("Lien partagé !");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Erreur lors du partage");
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement de la facture...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Facture introuvable</h2>
        <p className="text-muted-foreground">Cette facture n'existe pas ou a été supprimée</p>
        <Button onClick={() => navigate("/admin/invoices")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux factures
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[invoice.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 print:bg-white print:p-0">
      {/* Barre d'actions */}
      <div className="max-w-5xl mx-auto mb-6 print:hidden">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/invoices")}
                className="w-full md:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={handlePrintThermal}
                  disabled={printing}
                  className="flex-1 md:flex-none"
                >
                  {printing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Impression...
                    </>
                  ) : (
                    <>
                      <Printer className="mr-2 h-4 w-4" />
                      Reçu 80mm
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex-1 md:flex-none"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      PDF A4
                    </>
                  )}
                </Button>
                <Button onClick={handleShare} variant="outline" className="flex-1 md:flex-none">
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu facture */}
      <div className="max-w-5xl mx-auto">
        <Card
          ref={printRef}
          className="shadow-2xl print:shadow-none print:border-none bg-white"
        >
          <CardContent className="p-8 md:p-12">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8 pb-8 border-b-2">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  {SHOP_INFO.logo && (
                    <img
                      src={SHOP_INFO.logo}
                      alt={SHOP_INFO.name}
                      className="h-16 w-16 object-contain"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {SHOP_INFO.name}
                    </h1>
                    <p className="text-sm text-primary font-medium">{SHOP_INFO.website}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{SHOP_INFO.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{SHOP_INFO.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{SHOP_INFO.email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    ICE : {SHOP_INFO.ice}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  FACTURE
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-muted-foreground">N°</span>
                    <span className="font-mono font-bold">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(invoice.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <Badge className={statusInfo.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Facturé à
              </h3>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border-2 border-primary/20">
                <p className="font-bold text-lg text-gray-800 mb-2">
                  {invoice.customer_name}
                </p>
                <div className="space-y-1 text-sm text-gray-600">
                  {invoice.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{invoice.customer_email}</span>
                    </div>
                  )}
                  {invoice.customer_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{invoice.customer_phone}</span>
                    </div>
                  )}
                  {invoice.customer_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{invoice.customer_address}</span>
                    </div>
                  )}
                  {invoice.customer_city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{invoice.customer_city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Articles */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Articles</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">
                        Description
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">
                        Prix unitaire
                      </th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">
                        Qté
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {item.product_image && (
                              <img
                                src={item.product_image}
                                alt={item.product_name}
                                className="h-12 w-12 object-cover rounded"
                              />
                            )}
                            <span className="font-medium">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4">
                          {Number(item.unit_price || 0).toLocaleString()} FCFA
                        </td>
                        <td className="text-center py-4 px-4 font-semibold">
                          {item.quantity}
                        </td>
                        <td className="text-right py-4 px-4 font-bold text-primary">
                          {Number(item.total || 0).toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totaux */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
              <div className="flex-1">
                {qr && (
                  <div className="text-center md:text-left">
                    <p className="text-sm text-muted-foreground mb-3">
                      Scannez pour voir la facture en ligne
                    </p>
                    <img
                      src={qr}
                      alt="QR Code"
                      className="w-32 h-32 border-2 border-gray-200 rounded-lg inline-block"
                    />
                  </div>
                )}
              </div>

              <div className="w-full md:w-96">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700 pb-2 border-b">
                    <span>Sous-total HT:</span>
                    <span className="font-semibold">
                      {Number(invoice.amount || 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  {invoice.discount && invoice.discount > 0 && (
                    <div className="flex justify-between text-red-600 font-semibold pb-2 border-b">
                      <span>Remise:</span>
                      <span>-{Number(invoice.discount).toLocaleString()} FCFA</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-700 pb-2 border-b">
                    <span>TVA ({invoice.tax_rate || 0}%):</span>
                    <span className="font-semibold">
                      {Number(invoice.tax || 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-primary to-primary/90 text-white p-5 rounded-lg shadow-lg mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">TOTAL TTC</span>
                      <span className="text-2xl font-bold">
                        {Number(invoice.total || 0).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-8" />

            {/* Footer */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 text-sm text-gray-600">
              <div>
                <p className="font-semibold mb-2 text-gray-800">Conditions générales:</p>
                <ul className="space-y-1">
                  <li>• Garantie de 3 mois sur tous les produits</li>
                  <li>• Conservez ce reçu pour toute réclamation</li>
                  <li>• Échange possible sous 7 jours</li>
                </ul>
              </div>

              <div className="text-right">
                <p className="font-semibold mb-2 text-gray-800">Merci pour votre confiance !</p>
                <p className="text-xs text-muted-foreground">
                  Document généré le {new Date().toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePDF;
