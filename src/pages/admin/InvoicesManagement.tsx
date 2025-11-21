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

const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid": return "Payée";
    case "pending": return "En attente";
    case "cancelled": return "Annulée";
    default: return status;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-800";
    case "pending": return "bg-yellow-100 text-yellow-800";
    case "cancelled": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

const InvoicesManagement = () => {
  // États principaux
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // États création facture
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState<"pending" | "paid" | "cancelled">("pending");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "card" | "bank_transfer" | "other">("cash_on_delivery");
  const [selectedItems, setSelectedItems] = useState<Map<string, InvoiceItem>>(new Map());
  const [taxRate, setTaxRate] = useState("0");
  const [discount, setDiscount] = useState("0");

  // États stock
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  const navigate = useNavigate();

  // Chargement initial
  useEffect(() => {
    loadInvoices();
  }, [search, filterDate]);

  useEffect(() => {
    if (isDialogOpen) {
      loadInventory();
    }
  }, [isDialogOpen]);

  // Charger les factures
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await factures.getAllInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Erreur chargement factures:", error);
      toast.error("Erreur lors du chargement des factures");
    } finally {
      setLoading(false);
    }
  };

  // Charger l'inventaire
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await stock.getInventory({ page: 1, limit: 100 });
      setInventory(data.inventory.filter(p => p.stock > 0));
    } catch (error) {
      console.error("Erreur chargement inventaire:", error);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoadingInventory(false);
    }
  };

  // Ajouter un produit à la facture
  const addProductToInvoice = (product: InventoryItem) => {
    const newMap = new Map(selectedItems);
    
    if (newMap.has(product.id)) {
      const item = newMap.get(product.id)!;
      if (item.quantity < product.stock) {
        item.quantity += 1;
        item.total = item.quantity * item.unitPrice;
        newMap.set(product.id, item);
      } else {
        toast.error("Stock insuffisant");
        return;
      }
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

  // Retirer un produit
  const removeProductFromInvoice = (productId: string) => {
    const newMap = new Map(selectedItems);
    newMap.delete(productId);
    setSelectedItems(newMap);
  };

  // Mettre à jour la quantité
  const updateProductQuantity = (productId: string, quantity: number) => {
    const newMap = new Map(selectedItems);
    const item = newMap.get(productId);
    if (!item) return;

    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      newMap.delete(productId);
    } else if (quantity <= product.stock) {
      item.quantity = quantity;
      item.total = item.unitPrice * quantity;
      newMap.set(productId, item);
    } else {
      toast.error(`Stock insuffisant. Disponible: ${product.stock}`);
      return;
    }
    
    setSelectedItems(newMap);
  };

  // Calculer les totaux
  const calculateTotals = () => {
    let amount = 0;
    selectedItems.forEach(item => { 
      amount += Number(item.total || 0);
    });
    
    const discountAmount = parseFloat(discount) || 0;
    const amountAfterDiscount = Math.max(0, amount - discountAmount);
    const tax = amountAfterDiscount * ((parseFloat(taxRate) || 0) / 100);
    const total = amountAfterDiscount + tax;
    
    return { amount, discountAmount, tax, total };
  };

  // Sauvegarder la facture
  const saveInvoice = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error("Le nom et l'email du client sont obligatoires");
      return;
    }

    if (selectedItems.size === 0) {
      toast.error("Veuillez ajouter au moins un produit");
      return;
    }

    try {
      const items: InvoiceItem[] = Array.from(selectedItems.values());
      const totals = calculateTotals();

      const invoiceData = {
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
      };

      await factures.createInvoice(invoiceData);
      toast.success("Facture créée avec succès");
      
      setIsDialogOpen(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      console.error("Erreur création facture:", error);
      toast.error("Erreur lors de la création de la facture");
    }
  };

  // Réinitialiser le formulaire
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

  // Confirmer suppression
  const confirmDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Supprimer la facture
  const deleteExistingInvoice = async () => {
    if (!invoiceToDelete) return;
    
    try {
      await factures.deleteInvoice(invoiceToDelete);
      setInvoices(prev => prev.filter(i => i.id !== invoiceToDelete));
      toast.success("Facture supprimée avec succès");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setInvoiceToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Gestion des Factures</h1>
        <div className="flex gap-2 flex-wrap">
          <Input
            type="search"
            placeholder="Rechercher..."
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
        </div>
      </div>

      {/* Bouton nouvelle facture */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Facture
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle facture</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informations client */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">
                    Nom du client <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Mohamed Ali"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="client@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Téléphone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerCity">Ville</Label>
                  <Input
                    id="customerCity"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Casablanca"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="customerAddress">Adresse complète</Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>
            </div>

            {/* Produits sélectionnés */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                Produits sélectionnés ({selectedItems.size})
              </h3>
              
              {selectedItems.size === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun produit sélectionné. Ajoutez des produits ci-dessous.
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(selectedItems.values()).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{Number(item.unitPrice || 0).toFixed(2)} Fcfa</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) =>
                                  updateProductQuantity(item.id, parseInt(e.target.value) || 1)
                                }
                                className="w-16 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {Number(item.total || 0).toFixed(2)} Fcfa
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeProductFromInvoice(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Sélection des produits du stock */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Ajouter des produits depuis le stock</h3>
              
              {loadingInventory ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">Chargement des produits...</p>
                </div>
              ) : inventory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Aucun produit en stock disponible
                </p>
              ) : (
                <ScrollArea className="h-72 border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Stock disponible</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                              )}
                              <span>{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{Number(product.price || 0).toFixed(2)} Fcfa</TableCell>
                          <TableCell>
                            <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                              {product.stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addProductToInvoice(product)}
                              disabled={selectedItems.has(product.id)}
                            >
                              {selectedItems.has(product.id) ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Ajouté
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Ajouter
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>

            {/* Paramètres de la facture */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Paramètres de facturation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceStatus">Statut</Label>
                  <Select value={invoiceStatus} onValueChange={(v: any) => setInvoiceStatus(v)}>
                    <SelectTrigger id="invoiceStatus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                  <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash_on_delivery">Paiement à la livraison</SelectItem>
                      <SelectItem value="especes">espéces</SelectItem>
                      <SelectItem value="mobile_money">mobile money</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="taxRate">TVA (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min={0}
                    step={0.01}
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount">Remise (DH)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Résumé des totaux */}
            <div className="bg-muted p-6 rounded-lg space-y-3">
              <h3 className="font-semibold text-lg mb-4">Résumé</h3>
              <div className="flex justify-between text-sm">
                <span>Montant HT:</span>
                <span className="font-semibold">{Number(totals.amount || 0).toFixed(2)} Fcfa</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Remise:</span>
                <span className="font-semibold text-red-600">
                  -{Number(totals.discountAmount || 0).toFixed(2)} Fcfa
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA ({taxRate}%):</span>
                <span className="font-semibold">{Number(totals.tax || 0).toFixed(2)} Fcfa</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC:</span>
                  <span className="text-primary">{Number(totals.total || 0).toFixed(2)} Fcfa</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveInvoice}>
              <Plus className="mr-2 h-4 w-4" />
              Créer la facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table des factures */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune facture trouvée
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono font-semibold">
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell>{inv.customer_name}</TableCell>
                  <TableCell>{inv.customer_email}</TableCell>
                  <TableCell>{inv.customer_phone || "N/A"}</TableCell>
                  <TableCell>
                    {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {Number(inv.total || 0).toFixed(2)} Fcfa
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(inv.status)}>
                      {getStatusLabel(inv.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        title="Voir les détails"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirmDeleteInvoice(inv.id)}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteExistingInvoice}>
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesManagement;
