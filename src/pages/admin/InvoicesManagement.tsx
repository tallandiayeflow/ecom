"use client";

import { FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createInvoice, deleteInvoice, getInvoices } from "@/lib/api";

// Génération numéro facture
const generateInvoiceNumber = (): string =>
  `INV-${Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, "0")}`;

// Couleur badge selon statut
const getStatusClass = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500";
    case "pending":
      return "bg-yellow-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};


// Libellé statut
const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "Payée";
    case "pending":
      return "En attente";
    case "cancelled":
      return "Annulée";
    default:
      return status;
  }
};

const InvoicesManagement = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [newInvoice, setNewInvoice] = useState<any>({
    invoice_number: generateInvoiceNumber(),
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "",
    items: [],
    status: "pending",
    payment_method: "cash_on_delivery",
    notes: "",
    amount: "",
    total: "",
  });
  const [currentItem, setCurrentItem] = useState({
    product_name: "",
    unit_price: "",
    quantity: 1,
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, [search, filterDate]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterDate) params.append("date", filterDate);

      const data = await getInvoices(params.toString());
      setInvoices(data);
    } catch (error) {
      toast.error("Erreur chargement factures");
    } finally {
      setLoading(false);
    }
  };

  const addItemToInvoice = () => {
    if (
      !currentItem.product_name ||
      !currentItem.unit_price ||
      Number(currentItem.unit_price) <= 0 ||
      currentItem.quantity <= 0
    ) {
      toast.error("Veuillez remplir tous les champs du produit.");
      return;
    }
    const item = {
      id: crypto.randomUUID(),
      product_name: currentItem.product_name,
      unit_price: currentItem.unit_price,
      quantity: currentItem.quantity,
      total: (Number(currentItem.unit_price) * currentItem.quantity).toFixed(2),
    };
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, item],
    });
    setCurrentItem({ product_name: "", unit_price: "", quantity: 1 });
    toast.success("Article ajouté.");
  };

  const removeItem = (id: string) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((i: any) => i.id !== id),
    });
  };

  const prepareInvoiceDataForBackend = (invoice: any) => {
    const amount = invoice.items.reduce(
      (acc: number, item: any) => acc + Number(item.unit_price) * item.quantity,
      0
    );
    return {
      ...invoice,
      amount: amount.toFixed(2),
      total: amount.toFixed(2),
    };
  };

  const saveInvoice = async () => {
    if (!newInvoice.customer_name || !newInvoice.customer_email || newInvoice.items.length === 0) {
      toast.error("Veuillez remplir tous les champs et ajouter au moins un article");
      return;
    }
    try {
      const invoiceToSend = prepareInvoiceDataForBackend(newInvoice);
      const created = await createInvoice(invoiceToSend);
      setInvoices([created, ...invoices]);
      setIsDialogOpen(false);
      setNewInvoice({
        invoice_number: generateInvoiceNumber(),
        customer_name: "",
        customer_email: "",
        customer_phone: "",
        customer_address: "",
        customer_city: "",
        items: [],
        status: "pending",
        payment_method: "cash_on_delivery",
        notes: "",
        amount: "",
        total: "",
      });
      toast.success("Facture créée.");
    } catch {
      toast.error("Erreur création facture.");
    }
  };

  const deleteExistingInvoice = async (id: string) => {
    if (!confirm("Confirmer la suppression ?")) return;
    try {
      await deleteInvoice(id);
      setInvoices((prev) => prev.filter((i) => i.id !== id));
      toast.success("Facture supprimée.");
    } catch {
      toast.error("Erreur suppression facture.");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Factures</h1>
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Recherche par nom, email ou téléphone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64"
          />
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full md:w-48"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Plus /> Nouvelle Facture
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle>Création de facture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom du client</Label>
                    <Input
                      value={newInvoice.customer_name}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email du client</Label>
                    <Input
                      value={newInvoice.customer_email}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customer_email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={newInvoice.customer_phone}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customer_phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ville</Label>
                    <Input
                      value={newInvoice.customer_city}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customer_city: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Adresse</Label>
                    <Input
                      value={newInvoice.customer_address}
                      onChange={(e) => setNewInvoice({ ...newInvoice, customer_address: e.target.value })}
                    />
                  </div>
                </div>

                <hr className="my-2" />
                <h3 className="text-lg font-semibold">Articles</h3>
                {newInvoice.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded mb-1">
                    <span>{item.product_name} ({item.quantity} × {Number(item.unit_price).toFixed(2)} Fcfa)</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}><Trash2 /></Button>
                  </div>
                ))}

                <div className="flex gap-2 items-end">
                  <Input
                    placeholder="Nom article"
                    value={currentItem.product_name}
                    onChange={(e) => setCurrentItem({ ...currentItem, product_name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Prix unitaire"
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit_price: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Quantité"
                    min={1}
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) || 1 })}
                  />
                  <Button onClick={addItemToInvoice} type="button" className="flex items-center"><Plus /></Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <select
                      value={newInvoice.status}
                      onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="pending">En attente</option>
                      <option value="paid">Payée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                  </div>
                  <div>
                    <Label>Méthode de paiement</Label>
                    <select
                      value={newInvoice.payment_method}
                      onChange={(e) => setNewInvoice({ ...newInvoice, payment_method: e.target.value })}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="cash_on_delivery">À la livraison</option>
                      <option value="card">Carte</option>
                      <option value="bank_transfer">Virement</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Input value={newInvoice.notes || ""} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={saveInvoice}>Enregistrer</Button>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">N°</TableHead>
              <TableHead className="text-center">Client</TableHead>
              <TableHead className="text-center">Email</TableHead>
              <TableHead className="text-center">Téléphone</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Statut</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-gray-50">
                <TableCell className="text-center">{inv.invoice_number || "N/A"}</TableCell>
                <TableCell className="text-center">{inv.customer_name || "N/A"}</TableCell>
                <TableCell className="text-center">{inv.customer_email || "N/A"}</TableCell>
                <TableCell className="text-center">{inv.customer_phone || "N/A"}</TableCell>
                <TableCell className="text-center">
                  {inv.created_at ? new Date(inv.created_at).toLocaleDateString("fr-FR") : "N/A"}
                </TableCell>
                <TableCell className="text-center">{Number(inv.total).toFixed(2)} Fcfa</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-block px-2 py-1 rounded-full text-white text-sm bg-blue-400`}>
                    {getStatusLabel(inv.status)}
                  </span>
                </TableCell>
                <TableCell className="text-center flex justify-center gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/invoices/${inv.id}`)} title="Voir le reçu"><FileText /></Button>
                  <Button variant="ghost" onClick={() => deleteExistingInvoice(inv.id)} title="Supprimer"><Trash2 /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoicesManagement;
