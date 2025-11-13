"use client";

import { Button } from "@/components/ui/button";
import { getInvoice } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    } catch (error) {
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
      win.document.write(`<html><head><title>Reçu Facture</title></head><body>${printContents}</body></html>`);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo
    doc.addImage(SHOP_INFO.logo, "PNG", 20, 12, 32, 18, undefined, "FAST");

    // Titre facture
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURE", 20, 30);

    // Infos facture
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Facture n°: ${invoice.invoice_number}`, 20, 40);
    doc.text(`Date: ${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("fr-FR") : ""}`, 20, 46);

    // Infos boutique
    doc.setFont("helvetica", "bold");
    doc.text(SHOP_INFO.name, pageWidth - 80, 14);
    doc.setFont("helvetica", "normal");
    doc.text(SHOP_INFO.address, pageWidth - 80, 20);
    doc.text(SHOP_INFO.phone, pageWidth - 80, 26);

    doc.setLineWidth(0.5);
    doc.line(20, 50, pageWidth - 20, 50);

    // Infos client
    doc.setFont("helvetica", "bold");
    doc.text("Client :", 20, 58);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customer_name || "", 20, 64);
    doc.text(invoice.customer_email || "", 20, 70);
    doc.text(invoice.customer_phone || "", 20, 76);

    // Table des produits avec colonnes centrées
    const tableData = invoice.items.map((item: any) => [
      item.product_name,
      `${Number(item.unit_price).toFixed(2)} Fcfa`,
      item.quantity.toString(),
      `${Number(item.total).toFixed(2)} Fcfa`,
    ]);

    autoTable(doc, {
      startY: 86,
      head: [["DESCRIPTION", "PRIX", "QUANTITÉ", "TOTAL"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 5, halign: "center" },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const total = Number(invoice.amount || 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL : ${total.toFixed(2)} Fcfa`, 20, finalY);

    // QR code en bas à gauche avec "Scannez le code"
    if (qr) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Scannez le code", 20, finalY + 30);
      doc.addImage(qr, "PNG", 20, finalY + 35, 40, 40);
    }

    // Garantie 3 mois en bas à droite
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Garantie : 3 mois", pageWidth - 60, finalY + 60);

    doc.save(`Facture_${invoice.invoice_number}.pdf`);
  };

  if (loading) return <div>Chargement...</div>;
  if (!invoice) return <div>Facture introuvable</div>;

  return (
    <div>
      <div
        ref={printRef}
        style={{
          background: "#fff",
          padding: 32,
          maxWidth: 700,
          margin: "auto",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
          fontFamily: "Arial, sans-serif",
          borderRadius: 8,
        }}
      >
        {/* En-tête */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <img src={SHOP_INFO.logo} alt="Logo" style={{ height: 52 }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 20 }}>{SHOP_INFO.name}</div>
            <div>{SHOP_INFO.address}</div>
            <div>{SHOP_INFO.phone}</div>
          </div>
        </div>

        {/* Résumé facture */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#222" }}>FACTURE</div>
          <div style={{ marginTop: 8, lineHeight: 1.5 }}>
            <div><strong>Code :</strong> {invoice.invoice_number}</div>
            <div><strong>Date :</strong> {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("fr-FR") : ""}</div>
            <div><strong>Client :</strong> {invoice.customer_name}</div>
          </div>
        </div>

        {/* Table des produits */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr style={{ background: "#222", color: "#fff", textAlign: "center" }}>
              <th style={{ padding: 8 }}>DESCRIPTION</th>
              <th style={{ padding: 8 }}>PRIX</th>
              <th style={{ padding: 8 }}>QUANTITÉ</th>
              <th style={{ padding: 8 }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                <td style={{ padding: 8 }}>{item.product_name}</td>
                <td style={{ padding: 8 }}>{Number(item.unit_price).toFixed(2)} Fcfa</td>
                <td style={{ padding: 8 }}>{item.quantity}</td>
                <td style={{ padding: 8 }}>{Number(item.total).toFixed(2)} Fcfa</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ marginTop: 20, fontSize: 18, fontWeight: 700, textAlign: "left" }}>
          TOTAL : {Number(invoice.amount).toFixed(2)} Fcfa
        </div>

        {/* Footer : QR code et garantie */}
        <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <div>Scannez le code</div>
            {qr && <img src={qr} alt="QR code" style={{ height: 64, marginTop: 8 }} />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, textAlign: "right" }}>
            Garantie : 3 mois
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Button onClick={handlePrint}>Imprimer le reçu</Button>
        <Button onClick={handleDownloadPDF} variant="outline" className="ml-3">
          Télécharger PDF
        </Button>
        <Button onClick={() => navigate("/admin/invoices")} variant="ghost" className="ml-3">
          Retour
        </Button>
      </div>
    </div>
  );
};

export default InvoicePDF;
