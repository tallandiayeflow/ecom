"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUser, deleteUser, getUsers, updateUser } from "@/lib/api";
import type { User } from "@/types";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Hash,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  User as UserIcon,
  UserPlus,
  Users,
  X,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    role: "user" as "user" | "admin",
    password: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getUsers();
      setUsers(list);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.phone?.toLowerCase().includes(q) ||
      user.city?.toLowerCase().includes(q) ||
      user.address?.toLowerCase().includes(q)
    );
  });

  const openEditDialog = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setIsNewUser(false);
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        address: user.address ?? "",
        city: user.city ?? "",
        role: user.role,
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
        city: "",
        role: "user",
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
      city: "",
      role: "user",
      password: "",
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error("Le nom et l'email sont obligatoires");
      return;
    }

    if (isNewUser && !form.password) {
      toast.error("Le mot de passe est obligatoire pour un nouvel utilisateur");
      return;
    }

    if (form.password && form.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setSubmitting(true);
      if (isNewUser) {
        await createUser(form);
        toast.success("Utilisateur créé avec succès ! 🎉");
      } else if (selectedUser) {
        await updateUser(selectedUser.id, form);
        toast.success("Utilisateur mis à jour avec succès ! ✅");
      }
      closeDialog();
      loadUsers();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Erreur lors de l'enregistrement";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setSubmitting(true);
      await deleteUser(userToDelete.id);
      toast.success("Utilisateur supprimé avec succès ! 🗑️");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Erreur lors de la suppression";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tous les utilisateurs</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Comptes actifs</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-gray-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">Comptes désactivés</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">Rôle admin</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredUsers.length} utilisateur(s) • {stats.active} actif(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => openEditDialog()} disabled={loading}>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
              <Button variant="outline" onClick={loadUsers} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email, téléphone..."
              className="pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
                <p className="text-muted-foreground max-w-md">
                  {search
                    ? "Aucun utilisateur ne correspond à votre recherche"
                    : "Créez votre premier utilisateur"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Utilisateur</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Localisation</TableHead>
                        <TableHead className="font-semibold text-center">Rôle</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-center">Points</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  #{user.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {user.city && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  <span>{user.city}</span>
                                </div>
                              )}
                              {user.address && (
                                <p className="text-muted-foreground text-xs truncate max-w-[200px]">
                                  {user.address}
                                </p>
                              )}
                              {!user.city && !user.address && (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className={
                                user.role === "admin"
                                  ? "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                  : ""
                              }
                            >
                              {user.role === "admin" ? (
                                <>
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <UserIcon className="h-3 w-3 mr-1" />
                                  User
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={user.isActive ? "default" : "secondary"}
                              className={
                                user.isActive
                                  ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                  : ""
                              }
                            >
                              {user.isActive ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Actif
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactif
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Hash className="h-4 w-4 text-amber-500" />
                              <span className="font-semibold text-amber-500">
                                {user.loyaltyPoints || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(user)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenDeleteDialog(user)}
                                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <div className="flex gap-2">
                                <Badge
                                  variant={user.role === "admin" ? "default" : "secondary"}
                                  className={
                                    user.role === "admin"
                                      ? "bg-purple-500/10 text-purple-500"
                                      : ""
                                  }
                                >
                                  {user.role === "admin" ? "Admin" : "User"}
                                </Badge>
                                <Badge
                                  variant={user.isActive ? "default" : "secondary"}
                                  className={
                                    user.isActive ? "bg-green-500/10 text-green-500" : ""
                                  }
                                >
                                  {user.isActive ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            {user.phone && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Téléphone:</span>
                                <span className="font-medium">{user.phone}</span>
                              </div>
                            )}
                            {user.city && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Ville:</span>
                                <span className="font-medium">{user.city}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Points fidélité:</span>
                              <span className="font-semibold text-amber-500">
                                {user.loyaltyPoints || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(user)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDeleteDialog(user)}
                              className="flex-1 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ajout/Édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              {isNewUser ? "Ajouter un utilisateur" : "Modifier l'utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {isNewUser
                ? "Créez un nouveau compte utilisateur"
                : `Modifier les informations de ${selectedUser?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Nom complet *
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@example.com"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+221 XX XXX XX XX"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ville
                </Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Dakar"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Avenue de la République"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rôle
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(value: "user" | "admin") =>
                    setForm({ ...form, role: value })
                  }
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Utilisateur
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrateur
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Mot de passe {isNewUser ? "*" : "(optionnel)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required={isNewUser}
                  disabled={submitting}
                />
                {!isNewUser && (
                  <p className="text-xs text-muted-foreground">
                    Laisser vide pour ne pas modifier
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Conseil:</strong> Les administrateurs ont accès au panneau d'administration
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isNewUser ? (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur "
              <span className="font-semibold">{userToDelete?.name}</span>" (
              {userToDelete?.email}) ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersManagement;
