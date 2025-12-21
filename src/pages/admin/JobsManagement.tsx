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
import { deleteJob, downloadJobCV, getAllJobs } from "@/lib/api"
import { motion } from "framer-motion"
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileText,
    Filter,
    Mail,
    Phone,
    RefreshCw,
    Search,
    Trash2,
    User,
    X
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Types
type JobStatus = "pending" | "accepted" | "rejected"
type JobApplication = {
  id: string
  full_name: string
  phone: string
  email: string
  desired_position: string
  cv_filename: string
  status: JobStatus
  admin_notes?: string
  created_at: string
}

const JobsManagement = () => {
  // States
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<JobApplication | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)

  // Fetch jobs
  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params: any = {
        limit: perPage,
        offset: (page - 1) * perPage,
      }
      if (filterStatus !== "all") params.status = filterStatus
      if (search) params.search = search

      const data = await getAllJobs(params)
      setJobs(data.jobs)
      setTotal(data.total)
    } catch (error) {
      toast.error("Erreur lors du chargement des candidatures")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [page, perPage, filterStatus, search])

  // Filtrage local
  const filteredJobs = jobs.filter(job =>
    !search ||
    job.full_name.toLowerCase().includes(search.toLowerCase()) ||
    job.phone.includes(search) ||
    job.email.toLowerCase().includes(search.toLowerCase()) ||
    job.desired_position.toLowerCase().includes(search.toLowerCase())
  )

  // Actions
  const confirmDelete = (job: JobApplication) => {
    setJobToDelete(job)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!jobToDelete) return
    try {
      await deleteJob(jobToDelete.id)
      toast.success("Candidature supprimée")
      fetchJobs()
    } catch (error) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleteDialogOpen(false)
      setJobToDelete(null)
    }
  }

  const handleViewDetails = (job: JobApplication) => {
    setSelectedJob(job)
    setDetailsDialogOpen(true)
  }

  const handleDownloadCV = async (jobId: string) => {
    try {
      const blob = await downloadJobCV(jobId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `CV_${jobId.slice(0, 8)}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success("CV téléchargé")
    } catch (error) {
      toast.error("Erreur lors du téléchargement")
    }
  }

  // Status config
  const statusConfig: Record<JobStatus, { label: string; icon: any; className: string }> = {
    pending: {
      label: "En attente",
      icon: FileText,
      className: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    },
    accepted: {
      label: "Acceptée",
      icon: User,
      className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    },
    rejected: {
      label: "Rejetée",
      icon: X,
      className: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    },
  }

  const getStatusBadge = (status: JobStatus) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Stats
  const stats = {
    total,
    pending: jobs.filter(j => j.status === "pending").length,
    accepted: jobs.filter(j => j.status === "accepted").length,
    rejected: jobs.filter(j => j.status === "rejected").length,
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-1.02 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidatures</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Toutes les candidatures</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-1.02 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-1.02 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
            <p className="text-xs text-muted-foreground">Candidats retenus</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:scale-1.02 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Non retenues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Gestion des Candidatures
              </CardTitle>
              <CardDescription className="text-sm">
                {filteredJobs.length} candidatures | {stats.total} total
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={fetchJobs}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, téléphone, email, poste..."
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

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="h-11">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
              </SelectContent>
            </Select>

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
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucune candidature trouvée</h3>
                <p className="text-muted-foreground max-w-md">
                  {search || filterStatus !== "all" ? "Essayez de modifier vos critères de recherche" : "Les candidatures apparaîtront ici une fois soumises"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Candidat</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Poste</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-center">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job, index) => (
                        <motion.tr
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group hover:bg-accent/50 transition-all duration-200 border-b"
                        >
                          <TableCell>
                            <p className="font-mono font-semibold text-sm">
                              {job.id.slice(0, 8)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{job.full_name}</p>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{job.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Mail className="h-3 w-3" />
                              <span>{job.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{job.desired_position}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.created_at).toLocaleDateString("fr-FR")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(job.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleViewDetails(job)}
                                className="h-9 w-9 hover:bg-primary/10 hover:text-primary"
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDownloadCV(job.id)}
                                className="h-9 w-9 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Télécharger CV"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => confirmDelete(job)}
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
                  {filteredJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-primary/20">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-semibold">{job.full_name}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {job.id.slice(0, 8)}
                              </p>
                            </div>
                            {getStatusBadge(job.status)}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Poste</span>
                              <span>{job.desired_position}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tél</span>
                              <span>{job.phone}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email</span>
                              <span className="truncate">{job.email}</span>
                            </div>
                          </div>

                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-muted-foreground">Date</span>
                            <span>{new Date(job.created_at).toLocaleDateString("fr-FR")}</span>
                          </div>

                          {/* Actions Mobile */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(job)}
                              className="w-full"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Détails
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCV(job.id)}
                              className="w-full"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              CV
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmDelete(job)}
                              className="w-full text-destructive hover:bg-destructive/10"
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
              Détails Candidature
            </DialogTitle>
            <DialogDescription>
              Candidature {selectedJob?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Candidat Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations Candidat
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">Nom complet</Label>
                    <p className="font-medium">{selectedJob.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Téléphone</Label>
                    <p className="font-medium">{selectedJob.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedJob.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Poste souhaité</Label>
                    <p className="font-medium">{selectedJob.desired_position}</p>
                  </div>
                </div>
              </div>

              {/* CV & Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CV & Statut
                </h3>
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">CV: {selectedJob.cv_filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedJob.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <Button onClick={() => handleDownloadCV(selectedJob.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm font-medium">Statut actuel</span>
                    <div>{getStatusBadge(selectedJob.status)}</div>
                  </div>
                  {selectedJob.admin_notes && (
                    <div className="pt-3 border-t">
                      <Label className="text-xs text-muted-foreground">Notes Admin</Label>
                      <p className="text-sm">{selectedJob.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-destructive" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la candidature{" "}
              <span className="font-semibold">{jobToDelete?.id.slice(0, 8)}</span> ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
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

export default JobsManagement
