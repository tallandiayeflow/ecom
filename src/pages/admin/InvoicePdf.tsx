"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { facturesAPI } from "@/lib/api";
import type { Invoice } from "@/types/invoices.ts";
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
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const SHOP_INFO = {
  name: "TEUSS PHONE SHOP",
  address: "Dakar, Sénégal",
  phone: "+221 77 000 0000",
  email: "contact@teussphone.sn",
  ice: "ICE000000000",
  logo: "/logo.png",
  website: "www.teussphone.sn",
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

const InvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) loadInvoice(id);
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    setLoading(true);
    try {
      const data = await facturesAPI.getById(invoiceId);
      setInvoice(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement de la facture");
      navigate("/admin/invoices");
    } finally {
      setLoading(false);
    }
  };

  // Téléchargement du PDF depuis le backend
  const handleDownloadPDF = async () => {
    if (!invoice) return;

    setDownloading(true);
    try {
      toast.loading("Génération du PDF...", { id: "pdf-download" });
      await facturesAPI.downloadPdf(invoice.id);
      toast.success("PDF téléchargé avec succès ! 📄", { id: "pdf-download" });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Erreur lors du téléchargement du PDF";
      toast.error(errorMsg, { id: "pdf-download" });
    } finally {
      setDownloading(false);
    }
  };

  // Impression (ouvre le PDF dans un nouvel onglet pour impression)
  const handlePrint = async () => {
    if (!invoice) return;

    try {
      toast.loading("Préparation de l'impression...", { id: "pdf-print" });

      // Créer une URL temporaire pour le PDF
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/factures/${invoice.id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la récupération du PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Ouvrir dans un nouvel onglet pour impression
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            toast.success("Fenêtre d'impression ouverte", { id: "pdf-print" });
          }, 250);
        };
      } else {
        toast.error("Impossible d'ouvrir la fenêtre d'impression", { id: "pdf-print" });
      }

      // Libérer la mémoire après 1 minute
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);

    } catch (error: any) {
      console.error(error);
      toast.error("Erreur lors de l'impression", { id: "pdf-print" });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      {/* Barre d'actions */}
      <div className="max-w-5xl mx-auto mb-6">
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
                  onClick={handlePrint}
                  disabled={downloading}
                  className="flex-1 md:flex-none"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimer
                </Button>
                <Button
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
                      Télécharger PDF
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
        <Card className="shadow-2xl bg-white">
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
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
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
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
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
                <div className="bg-muted/30 p-6 rounded-lg">
                  <p className="text-sm font-semibold mb-2 text-gray-800">
                    Informations de paiement
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Méthode:</span>
                      <span className="font-medium">
                        {invoice.payment_method === 'cash_on_delivery' && 'Espèces'}
                        {invoice.payment_method === 'card' && 'Carte bancaire'}
                        {invoice.payment_method === 'bank_transfer' && 'Virement'}
                        {invoice.payment_method === 'other' && 'Autre'}
                        {invoice.payment_method === 'espèces' && 'Espèces'}
                        {invoice.payment_method === 'Mobile Money' && 'Mobile Money'}
                      </span>
                    </div>
                    {invoice.payment_date && (
                      <div className="flex justify-between">
                        <span>Payé le:</span>
                        <span className="font-medium">
                          {new Date(invoice.payment_date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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

            {invoice.notes && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-800 mb-1">Notes:</p>
                <p className="text-sm text-yellow-700">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceDetails;