"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { createUser, getUsers, updateUser } from "@/lib/api";
import type { User } from "@/types";
import { motion } from "framer-motion";
import { Loader2, RefreshCcw, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getUsers();
      setUsers(list);
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.phone?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const openEditDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setIsNewUser(false);
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        address: user.address ?? "",
        password: "",
      });
    } else {
      setSelectedUser(null);
      setIsNewUser(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        password: "",
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setIsNewUser(false);
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    });
  };

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error("Le nom et l'email sont obligatoires");
      return;
    }
    if (form.password && form.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    try {
      if (isNewUser) {
        await createUser(form);
        toast.success("Utilisateur créé avec succès");
      } else if (selectedUser) {
        await updateUser(selectedUser.id, form);
        toast.success("Utilisateur mis à jour avec succès");
      }
      closeDialog();
      loadUsers();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Gestion des utilisateurs
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Actualiser
          </Button>
          <Button onClick={() => openEditDialog()}>
            <UserPlus className="w-4 h-4 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Rechercher par nom, email ou téléphone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>{user.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-6"
                  >
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle>
              {isNewUser ? "Ajouter un utilisateur" : "Modifier l’utilisateur"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">
                Mot de passe{" "}
                <span className="text-sm text-muted-foreground">
                  {isNewUser
                    ? "(requis)"
                    : "(laisser vide pour ne pas modifier)"}
                </span>
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required={isNewUser}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedUser(null);
                  setIsNewUser(false);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {isNewUser ? "Créer" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;