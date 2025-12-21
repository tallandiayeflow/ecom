"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { deleteAppointment, getAdminAppointments, updateAppointmentStatus } from "@/lib/api"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "framer-motion"
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    Edit,
    Eye,
    Filter,
    Phone,
    RefreshCw,
    Search,
    Trash2,
    User,
    X,
    XCircle
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Types
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

type Appointment = {
  id: string
  user_name: string
  user_phone: string
  service_name: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  notes?: string
  created_at: string
}

const AppointmentsManagement = () => {
  // States
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterDate, setFilterDate] = useState("")
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [newStatus, setNewStatus] = useState<AppointmentStatus>("pending")
  const [adminNotes, setAdminNotes] = useState("")

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: perPage,
      }
      if (filterStatus !== "all") params.status = filterStatus
      if (filterDate) params.date = filterDate
      if (search) params.search = search

      const data = await getAdminAppointments(params)
      setAppointments(data.appointments || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error("Erreur lors du chargement des RDV")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [page, perPage, filterStatus, filterDate])

  // Actions
  const confirmDelete = (appointment: Appointment) => {
    setAppointmentToDelete(appointment)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!appointmentToDelete) return
    try {
      await deleteAppointment(appointmentToDelete.id)
      toast.success("RDV supprimé")
      fetchAppointments()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteDialogOpen(false)
      setAppointmentToDelete(null)
    }
  }

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDetailsDialogOpen(true)
  }

  const openStatusDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setNewStatus(appointment.status)
    setAdminNotes(appointment.notes || "")
    setStatusDialogOpen(true)
  }

  const handleUpdateStatus = async () => {
    if (!selectedAppointment) return
    try {
      await updateAppointmentStatus(selectedAppointment.id, {
        status: newStatus,
        notes: adminNotes
      })
      toast.success("Statut mis à jour")
      fetchAppointments()
      setStatusDialogOpen(false)
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
  }

  // Status config
  const statusConfig: Record<AppointmentStatus, { label: string; icon: any; className: string }> = {
    pending: {
      label: "En attente",
      icon: Clock,
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20",
    },
    confirmed: {
      label: "Confirmé",
      icon: CheckCircle,
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20",
    },
    completed: {
      label: "Terminé",
      icon: CheckCircle,
      className: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
    },
    cancelled: {
      label: "Annulé",
      icon: XCircle,
      className: "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20",
    },
    no_show: {
      label: "Absent",
      icon: AlertCircle,
      className: "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20",
    },
  }

  const getStatusBadge = (status: AppointmentStatus) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Stats
  const stats = {
    total,
    pending: appointments.filter(a => a.status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RDV</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tous les rendez-vous</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À confirmer</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmés</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Validés</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Effectués</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annulés</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Non honorés</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Gestion des Rendez-vous
              </CardTitle>
              <CardDescription className="text-sm">
                {appointments.length} RDV affichés | {stats.total} total
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={fetchAppointments}
              disabled={loading}
              className="transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, téléphone, service..."
                className="pl-10 h-11"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
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

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="h-11">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="no_show">Absent</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
              className="h-11"
              placeholder="Filtrer par date"
            />

            <Select value={perPage.toString()} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 par page</SelectItem>
                <SelectItem value="20">20 par page</SelectItem>
                <SelectItem value="50">50 par page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            {loading ? (
              <div className="p-8 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun rendez-vous trouvé</h3>
                <p className="text-muted-foreground max-w-md">
                  {search || filterStatus !== "all" || filterDate 
                    ? "Essayez de modifier vos critères de recherche" 
                    : "Les rendez-vous apparaîtront ici une fois réservés"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">Client</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Service</TableHead>
                        <TableHead className="font-semibold">Date & Heure</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((apt, index) => (
                        <motion.tr
                          key={apt.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <p className="font-medium">{apt.user_name}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{apt.user_phone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{apt.service_name}</p>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-medium">
                                <Calendar className="h-4 w-4 text-primary" />
                                {format(new Date(apt.appointment_date), 'dd MMM yyyy', { locale: fr })}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {apt.appointment_time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(apt.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewDetails(apt)}
                                className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openStatusDialog(apt)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Modifier statut"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => confirmDelete(apt)}
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
                  {appointments.map((apt, index) => (
                    <motion.div
                      key={apt.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">{apt.user_name}</p>
                                <p className="text-sm text-muted-foreground">{apt.user_phone}</p>
                              </div>
                            </div>
                            {getStatusBadge(apt.status)}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Service</span>
                              <span className="font-medium">{apt.service_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Date</span>
                              <span className="font-medium">
                                {format(new Date(apt.appointment_date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Heure</span>
                              <span className="font-medium">{apt.appointment_time}</span>
                            </div>
                          </div>

                          {/* Actions Mobile */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(apt)}
                              className="w-full"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openStatusDialog(apt)}
                              className="w-full"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmDelete(apt)}
                              className="w-full text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> sur{" "}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Détails du Rendez-vous
            </DialogTitle>
            <DialogDescription>
              RDV du {selectedAppointment && format(new Date(selectedAppointment.appointment_date), 'dd MMMM yyyy', { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              {/* Client Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations Client
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom</Label>
                    <p className="font-medium">{selectedAppointment.user_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Téléphone</Label>
                    <p className="font-medium">{selectedAppointment.user_phone}</p>
                  </div>
                </div>
              </div>

              {/* RDV Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Détails Rendez-vous
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Service</Label>
                      <p className="font-medium">{selectedAppointment.service_name}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Statut</Label>
                      <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedAppointment.appointment_date), 'EEEE dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Heure</Label>
                      <p className="font-medium text-lg">{selectedAppointment.appointment_time}</p>
                    </div>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">Notes</Label>
                      <p className="text-sm mt-1">{selectedAppointment.notes}</p>
                    </div>
                  )}
                  <div className="pt-3 border-t text-xs text-muted-foreground">
                    Réservé le {format(new Date(selectedAppointment.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              setDetailsDialogOpen(false)
              selectedAppointment && openStatusDialog(selectedAppointment)
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier statut
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Modifier le statut
            </DialogTitle>
            <DialogDescription>
              RDV de {selectedAppointment?.user_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau statut</Label>
              <Select value={newStatus} onValueChange={(v: AppointmentStatus) => setNewStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      En attente
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      Confirmé
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Terminé
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Annulé
                    </div>
                  </SelectItem>
                  <SelectItem value="no_show">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Absent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes (facultatif)</Label>
              <Textarea
                placeholder="Ajouter des notes sur ce RDV..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStatus}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rendez-vous de{" "}
              <span className="font-semibold">{appointmentToDelete?.user_name}</span> prévu le{" "}
              <span className="font-semibold">
                {appointmentToDelete && format(new Date(appointmentToDelete.appointment_date), 'dd/MM/yyyy')} à {appointmentToDelete?.appointment_time}
              </span> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AppointmentsManagement
