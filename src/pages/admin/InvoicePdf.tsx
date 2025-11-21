"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { factures } from "@/lib/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ArrowLeft, Download, Loader2, Printer } from "lucide-react";
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
};

const InvoicePDF = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState("");
  const printRef = useRef(null);

  // Charger la facture
  useEffect(() => {
    if (id) loadInvoice(id);
  }, [id]);

  // Générer QR code
  useEffect(() => {
    if (invoice) {
      const url = `${window.location.origin}/invoices/${invoice.id}`;
      QRCode.toDataURL(url, { width: 120 }).then(setQr);
    }
  }, [invoice]);

  const loadInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      const data = await factures.getInvoice(invoiceId);
      setInvoice(data);
    } catch {
      toast.error("Erreur lors du chargement de la facture");
      navigate("/admin/invoices");
    } finally {
      setLoading(false);
    }
  };

  // Impression thermique optimisée (format ticket)
  const handlePrintThermal = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=300,height=600");
    if (!win) return;

    // Contenu minimaliste optimisé impression thermique
    const content = printRef.current.innerHTML;

    win.document.write(`
      <html>
      <head>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            line-height: 1.3;
            max-width: 80mm;
            width: 80mm;
            background: #fff;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }
          .shop-name {
            font-weight: bold;
            font-size: 14px;
          }
          .receipt-title {
            font-size: 16px;
            margin: 10px 0;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
          }
          .info, .totals, .footer {
            margin-bottom: 10px;
          }
          .line {
            display: flex;
            justify-content: space-between;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding-top: 8px;
            padding-bottom: 8px;
          }
          .item-row {
            margin-bottom: 6px;
          }
          .bold { font-weight: bold; }
          .qr {
            text-align: center;
            margin-top: 10px;
            margin-bottom: 10px;
          }
          .small {
            font-size: 10px;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
              max-width: 80mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${SHOP_INFO.name}</div>
          <div>${SHOP_INFO.address}</div>
          <div>Tél: ${SHOP_INFO.phone}</div>
          <div>${SHOP_INFO.email}</div>
          <div>ICE: ${SHOP_INFO.ice}</div>
        </div>

        <div class="receipt-title">Reçu de vente</div>

        <div class="info small">
          <div class="line"><span>N° facture:</span><span>${invoice.invoice_number}</span></div>
          <div class="line"><span>Date:</span><span>${invoice.created_at ? new Date(invoice.created_at).toLocaleString("fr-FR") : ""}</span></div>
          <div class="line"><span>Client:</span><span>${invoice.customer_name}</span></div>
          ${invoice.customer_phone ? `<div class="line"><span>Téléphone:</span><span>${invoice.customer_phone}</span></div>` : ""}
          ${invoice.customer_address ? `<div class="line"><span>Adresse:</span><span>${invoice.customer_address}</span></div>` : ""}
        </div>

        <div class="items small">
          ${
            invoice.items?.map(i => `
            <div class="item-row">
              <div class="bold">${i.product_name}</div>
              <div class="line">
                <span>${i.quantity} x ${Number(i.unit_price || 0).toFixed(2)} DH</span>
                <span>${Number(i.total || 0).toFixed(2)} DH</span>
              </div>
            </div>
          `).join("")
          }
        </div>

        <div class="totals small">
          <div class="line"><span>Sous-total HT:</span><span>${Number(invoice.amount).toFixed(2)} DH</span></div>
          ${invoice.discount > 0 ? `<div class="line"><span>Remise:</span><span>-${Number(invoice.discount).toFixed(2)} DH</span></div>` : ""}
          <div class="line"><span>TVA (${invoice.tax_rate} %) :</span><span>${Number(invoice.tax).toFixed(2)} DH</span></div>
          <div class="line bold"><span>Total TTC:</span><span>${Number(invoice.total).toFixed(2)} DH</span></div>
        </div>

        <div class="footer small">
          Merci pour votre achat!<br />
          Garantie : 3 mois
        </div>

        <div class="qr">
          ${qr ? `<img src="${qr}" alt="QR Code" width="100" height="100" />` : ""}
        </div>
      </body>
      </html>
    `);

    win.document.close();
    win.onload = () => win.print();
  };

  // On enlève la fonction A4
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid":
        return "Payée";
      case "unpaid":
        return "Non Payée";
      case "canceled":
        return "Annulée";
      default:
        return "Inconnue";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "unpaid":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Download PDF option reste inchangée
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(`Facture_${invoice?.invoice_number}.pdf`);
    } catch {
      toast.error("Erreur création PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <p className="text-xl font-semibold">Facture introuvable</p>
        <Button onClick={() => navigate("/admin/invoices")}>
          <ArrowLeft className="mr-2" />Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:bg-white">
      {/* Barre d'actions */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center flex-wrap gap-4 print:hidden">
        <Button variant="outline" onClick={() => navigate("/admin/invoices")}>
          <ArrowLeft className="mr-2" /> Retour
        </Button>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handlePrintThermal}>
            <Printer className="mr-2" /> Reçu Thermique
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="mr-2" /> Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Contenu facture */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-10 border border-gray-200 print:shadow-none print:border-none print:p-0"
      >
        {/* En-tête */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            {SHOP_INFO.logo && <img src={SHOP_INFO.logo} className="h-16 mb-4" />}
            <h1 className="text-3xl font-bold text-gray-900">{SHOP_INFO.name}</h1>
            <p className="text-sm text-gray-600">{SHOP_INFO.address}</p>
            <p className="text-sm text-gray-600">Tél : {SHOP_INFO.phone}</p>
            <p className="text-sm text-gray-600">{SHOP_INFO.email}</p>
            <p className="text-sm text-gray-600">ICE : {SHOP_INFO.ice}</p>
          </div>

          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-800 tracking-tight">FACTURE</h2>
            <div className="mt-4 space-y-1 text-sm">
              <p>
                <strong>N° :</strong> {invoice.invoice_number}
              </p>
              <p>
                <strong>Date :</strong>{" "}
                {new Date(invoice.created_at).toLocaleDateString("fr-FR")}
              </p>
              <Badge className={getStatusColor(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Client */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-3">Facturé à</h3>
          <div className="bg-gray-50 p-5 rounded-lg border">
            <p className="font-semibold text-gray-800">{invoice.customer_name}</p>
            <p className="text-gray-600 text-sm">{invoice.customer_phone}</p>
            {invoice.customer_address && (
              <p className="text-gray-600 text-sm">{invoice.customer_address}</p>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Prix
                </th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">
                  Qté
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((it, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2">{it.product_name}</td>
                  <td className="text-right py-3 px-2">
                    {Number(it.unit_price).toFixed(2)} Fcfa
                  </td>
                  <td className="text-center py-3 px-2">{it.quantity}</td>
                  <td className="text-right py-3 px-2 font-semibold">
                    {Number(it.total).toFixed(2)} Fcfa
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end mb-12">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-gray-700 border-b pb-2">
              <span>Sous-total :</span>
              <span className="font-semibold">{Number(invoice.amount).toFixed(2)} Fcfa</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-600 font-semibold border-b pb-2">
                <span>Remise :</span>
                <span>-{Number(invoice.discount).toFixed(2)} Fcfa</span>
              </div>
            )}

            <div className="flex justify-between text-gray-700 border-b pb-2">
              <span>TVA ({invoice.tax_rate}%) :</span>
              <span>{Number(invoice.tax).toFixed(2)} Fcfa</span>
            </div>

            <div className="flex justify-between bg-primary text-white p-4 rounded-lg shadow">
              <span className="text-lg font-bold">Total TTC</span>
              <span className="text-xl font-bold">{Number(invoice.total).toFixed(2)} Fcfa</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t pt-6">
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">Conditions :</p>
            <p>• Garantie 3 mois</p>
            <p>• Conservez ce reçu</p>
          </div>

          {qr && <img src={qr} className="w-24 h-24" />}
        </div>
      </div>
    </div>
  );
};

export default InvoicePDF;
