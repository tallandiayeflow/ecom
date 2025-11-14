"use client";

import { Button } from "@/components/ui/button";
import { getInvoice } from "@/lib/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const SHOP_INFO = {
  name: "Boutique Apple Phone",
  address: "Guidiawaye, Dakar, Sénégal",
  phone: "33123 45 66 / 331236547",
  logo: "/logo.png",
};

const InvoicePDF = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) loadInvoice(id);
  }, [id]);

  useEffect(() => {
    if (invoice) {
      const invoiceURL = `${window.location.origin}/invoices/${invoice.id}`;
      QRCode.toDataURL(invoiceURL, { width: 80 }).then(setQr);
    }
  }, [invoice]);

  const loadInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      const data = await getInvoice(invoiceId);
      setInvoice(data);
    } catch {
      toast.error("Erreur chargement facture");
      navigate("/admin/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open("", "PRINT", "height=600,width=800");
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Reçu Facture</title>
            <style>
              body { font-family: Arial, sans-serif; color: #000; background: #fff; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 6px; text-align: center; }
              th { background: #eee; }
              .invoice-header, .invoice-footer { width: 100%; margin-bottom: 20px; }
              .qr-code { margin-top: 10px; }
            </style>
          </head>
          <body>${printContents}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Facture_${invoice.invoice_number}.pdf`);
    } catch {
      toast.error("Erreur lors du téléchargement PDF");
    }
  };

  if (loading) return <div className="text-center mt-20">Chargement...</div>;
  if (!invoice) return <div className="text-center mt-20">Facture introuvable</div>;

  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900 text-black dark:text-black">
      <div
        ref={printRef}
        className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg print:bg-white print:text-black"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 invoice-header">
          <img src={SHOP_INFO.logo} alt="Logo" className="h-16 mb-4 sm:mb-0" />
          <div className="text-right">
            <div className="font-bold text-xl">{SHOP_INFO.name}</div>
            <div className="text-sm">{SHOP_INFO.address}</div>
            <div className="text-sm">{SHOP_INFO.phone}</div>
          </div>
        </div>

        {/* Info Facture */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">FACTURE</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div><span className="font-semibold">Code :</span> {invoice.invoice_number}</div>
            <div><span className="font-semibold">Date :</span> {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("fr-FR") : ""}</div>
            <div><span className="font-semibold">Client :</span> {invoice.customer_name}</div>
          </div>
        </div>

        {/* Tableau articles */}
        <div className="overflow-x-auto">
          <table className="w-full border border-black text-black print:border-black">
            <thead className="bg-gray-200 print:bg-gray-200">
              <tr>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-center">Prix</th>
                <th className="p-2 text-center">Quantité</th>
                <th className="p-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, idx: number) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-gray-50 print:bg-white" : ""}>
                  <td className="p-2">{item.product_name}</td>
                  <td className="p-2 text-center">{Number(item.unit_price).toFixed(2)} Fcfa</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-center">{Number(item.total).toFixed(2)} Fcfa</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mt-4 text-lg font-bold">
          TOTAL : {Number(invoice.amount).toFixed(2)} Fcfa
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-6 sm:gap-0 invoice-footer">
          <div className="text-center sm:text-left">
            <div className="text-sm font-semibold">Scannez le code</div>
            {qr && <img src={qr} alt="QR code" className="h-20 w-20 mx-auto sm:mx-0 mt-2 qr-code" />}
          </div>
          <div className="text-right text-sm font-semibold">
            Garantie : 3 mois
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
        <Button onClick={handlePrint}>Imprimer le reçu</Button>
        <Button variant="outline" onClick={handleDownloadPDF}>Télécharger PDF</Button>
        <Button variant="ghost" onClick={() => navigate("/admin/invoices")}>Retour</Button>
      </div>
    </div>
  );
};

export default InvoicePDF;
