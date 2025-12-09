"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryItem } from "@/lib/api";
import { factures, stock } from "@/lib/api";
import type { Invoice, InvoiceItem } from "@/types/invoices";
import { Check, FileText, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const generateInvoiceNumber = (): string =>
  `INV-${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`;

const statusMap = {
  paid: { label: "Payée", class: "bg-green-100 text-green-800" },
  pending: { label: "En attente", class: "bg-yellow-100 text-yellow-800" },
  cancelled: { label: "Annulée", class: "bg-red-100 text-red-800" },
};

const InvoicesManagement = () => {
  const navigate = useNavigate();

  // États principaux
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Dialogs
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  // États création facture
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState<"pending" | "paid" | "cancelled">("pending");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "card" | "bank_transfer" | "other">("cash_on_delivery");
  const [selectedItems, setSelectedItems] = useState<Map<string, InvoiceItem>>(new Map());
  const [taxRate, setTaxRate] = useState("20");
  const [discount, setDiscount] = useState("0");

  // États stock
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Chargement factures
  useEffect(() => {
    loadInvoices();
  }, [search, filterDate]);

  useEffect(() => {
    if (isDialogOpen) loadInventory();
  }, [isDialogOpen]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await factures.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await stock.getInventory({ page: 1, limit: 100 });
      setInventory(data.inventory.filter(p => p.stock > 0));
    } catch (error) {
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoadingInventory(false);
    }
  };

  const addProductToInvoice = (product: InventoryItem) => {
    const newMap = new Map(selectedItems);
    if (newMap.has(product.id)) {
      const item = newMap.get(product.id)!;
      if (item.quantity < product.stock) item.quantity += 1;
    } else {
      newMap.set(product.id, {
        id: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: 1,
        productId: product.id,
        productImage: product.imageUrl,
        total: product.price,
      });
    }
    setSelectedItems(newMap);
  };

  const removeProductFromInvoice = (productId: string) => {
    const newMap = new Map(selectedItems);
    newMap.delete(productId);
    setSelectedItems(newMap);
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    const newMap = new Map(selectedItems);
    const item = newMap.get(productId);
    if (!item) return;
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    if (quantity <= 0) newMap.delete(productId);
    else if (quantity <= product.stock) {
      item.quantity = quantity;
      item.total = item.unitPrice * quantity;
      newMap.set(productId, item);
    } else {
      toast.error(`Stock insuffisant. Disponible: ${product.stock}`);
      return;
    }

    setSelectedItems(newMap);
  };

  const calculateTotals = () => {
    let amount = 0;
    selectedItems.forEach(item => amount += Number(item.total || 0));
    const discountAmount = parseFloat(discount) || 0;
    const amountAfterDiscount = Math.max(0, amount - discountAmount);
    const tax = amountAfterDiscount * ((parseFloat(taxRate) || 0) / 100);
    const total = amountAfterDiscount + tax;
    return { amount, discountAmount, tax, total };
  };

  const saveInvoice = async () => {
    if (!customerName.trim() || !customerEmail.trim()) return toast.error("Nom et email requis");
    if (selectedItems.size === 0) return toast.error("Ajoutez au moins un produit");

    try {
      const items: InvoiceItem[] = Array.from(selectedItems.values());
      const totals = calculateTotals();
      await factures.createInvoice({
        invoice_number: generateInvoiceNumber(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        customerCity: customerCity.trim() || undefined,
        items,
        status: invoiceStatus,
        paymentMethod,
        taxRate: parseFloat(taxRate) || 0,
        discount: totals.discountAmount,
      });
      toast.success("Facture créée avec succès");
      setIsDialogOpen(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      toast.error("Erreur lors de la création de la facture");
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerCity("");
    setInvoiceStatus("pending");
    setPaymentMethod("cash_on_delivery");
    setSelectedItems(new Map());
    setTaxRate("20");
    setDiscount("0");
  };

  const confirmDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const deleteExistingInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await factures.deleteInvoice(invoiceToDelete);
      setInvoices(prev => prev.filter(i => i.id !== invoiceToDelete));
      toast.success("Facture supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setInvoiceToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Gestion des Factures</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-64"/>
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full md:w-48"/>
        </div>
      </div>

      {/* Nouvelle facture */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Facture
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une facture</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Client */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nom <span className="text-red-500">*</span></Label><Input value={customerName} onChange={e=>setCustomerName(e.target.value)}/></div>
              <div><Label>Email <span className="text-red-500">*</span></Label><Input type="email" value={customerEmail} onChange={e=>setCustomerEmail(e.target.value)}/></div>
              <div><Label>Téléphone</Label><Input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/></div>
              <div><Label>Ville</Label><Input value={customerCity} onChange={e=>setCustomerCity(e.target.value)}/></div>
              <div className="md:col-span-2"><Label>Adresse</Label><Input value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)}/></div>
            </div>

            {/* Produits sélectionnés */}
            <div>
              <h3 className="font-semibold mb-2">Produits sélectionnés ({selectedItems.size})</h3>
              {selectedItems.size===0 ? <p className="text-center py-4 text-muted-foreground">Aucun produit</p> :
                <ScrollArea className="h-56 border rounded-lg">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead><TableHead>Prix</TableHead><TableHead>Quantité</TableHead><TableHead>Total</TableHead><TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(selectedItems.values()).map(item=>(
                        <TableRow key={item.id}>
                          <TableCell className="flex items-center gap-2">
                            {item.productImage && <img src={item.productImage} className="w-10 h-10 rounded object-cover"/>}
                            {item.name}
                          </TableCell>
                          <TableCell>{item.unitPrice.toFixed(2)} Fcfa</TableCell>
                          <TableCell className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={()=>updateProductQuantity(item.id,item.quantity-1)}><Minus className="h-3 w-3"/></Button>
                            <Input type="number" value={item.quantity} onChange={e=>updateProductQuantity(item.id,parseInt(e.target.value)||1)} className="w-16 text-center"/>
                            <Button size="sm" variant="outline" onClick={()=>updateProductQuantity(item.id,item.quantity+1)}><Plus className="h-3 w-3"/></Button>
                          </TableCell>
                          <TableCell>{item.total.toFixed(2)} Fcfa</TableCell>
                          <TableCell><Button size="sm" variant="ghost" onClick={()=>removeProductFromInvoice(item.id)}><X className="h-4 w-4"/></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              }
            </div>

            {/* Stock */}
            <div>
              <h3 className="font-semibold mb-2">Ajouter depuis le stock</h3>
              {loadingInventory ? <div className="text-center py-8"><Loader2 className="animate-spin h-8 w-8 mx-auto"/></div> :
              inventory.length===0 ? <p className="text-center py-4 text-muted-foreground">Aucun produit disponible</p> :
              <ScrollArea className="h-64 border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Produit</TableHead><TableHead>Prix</TableHead><TableHead>Stock</TableHead><TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map(p=>(
                      <TableRow key={p.id}>
                        <TableCell className="flex items-center gap-2">{p.imageUrl && <img src={p.imageUrl} className="w-8 h-8 rounded"/>}{p.name}</TableCell>
                        <TableCell>{p.price.toFixed(2)} Fcfa</TableCell>
                        <TableCell><Badge variant={p.stock<10?"destructive":"secondary"}>{p.stock}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" disabled={selectedItems.has(p.id)} onClick={()=>addProductToInvoice(p)}>
                            {selectedItems.has(p.id)?<><Check className="h-4 w-4 mr-1"/>Ajouté</>:<><Plus className="h-4 w-4 mr-1"/>Ajouter</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>}
            </div>

            {/* Paramètres & Totaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select value={invoiceStatus} onValueChange={v=>setInvoiceStatus(v as any)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Méthode paiement</Label>
                <Select value={paymentMethod} onValueChange={v=>setPaymentMethod(v as any)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_on_delivery">Livraison</SelectItem>
                    <SelectItem value="card">Carte</SelectItem>
                    <SelectItem value="bank_transfer">Virement</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>TVA (%)</Label><Input type="number" value={taxRate} onChange={e=>setTaxRate(e.target.value)}/></div>
              <div><Label>Remise (Fcfa)</Label><Input type="number" value={discount} onChange={e=>setDiscount(e.target.value)}/></div>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4 space-y-1">
              <div className="flex justify-between">Montant HT: <span>{totals.amount.toFixed(2)}</span></div>
              <div className="flex justify-between text-red-600">Remise: -{totals.discountAmount.toFixed(2)}</div>
              <div className="flex justify-between">TVA: <span>{totals.tax.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">Total TTC: <span className="text-primary">{totals.total.toFixed(2)}</span></div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={()=>setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={saveInvoice}><Plus className="mr-2 h-4 w-4"/>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tableau factures */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>N°</TableHead><TableHead>Client</TableHead><TableHead>Email</TableHead><TableHead>Téléphone</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="animate-spin h-8 w-8 mx-auto"/></TableCell></TableRow> :
            invoices.length===0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune facture</TableCell></TableRow> :
            invoices.map(inv=>(
              <TableRow key={inv.id}>
                <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                <TableCell>{inv.customer_name}</TableCell>
                <TableCell>{inv.customer_email}</TableCell>
                <TableCell>{inv.customer_phone||"N/A"}</TableCell>
                <TableCell>{new Date(inv.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>{Number(inv.total||0).toFixed(2)}</TableCell>
                <TableCell><Badge className={statusMap[inv.status]?.class}>{statusMap[inv.status]?.label}</Badge></TableCell>
                <TableCell className="text-right flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={()=>navigate(`/invoices/${inv.id}`)} title="Voir"><FileText className="h-4 w-4"/></Button>
                  <Button size="sm" variant="ghost" onClick={()=>confirmDeleteInvoice(inv.id)} title="Supprimer"><Trash2 className="h-4 w-4 text-red-600"/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer la facture</DialogTitle></DialogHeader>
          <p>Êtes-vous sûr ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={deleteExistingInvoice}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesManagement;
