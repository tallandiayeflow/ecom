"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    SelectValue
} from "@/components/ui/select"
import { bookAppointment, getPublicSlots } from "@/lib/api"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { motion } from "framer-motion"
import {
    Briefcase,
    CalendarIcon,
    CheckCircle,
    Clock,
    Home,
    Loader2,
    Phone,
    User,
    UserCheck
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

const services = [
  { key: "facial_care", name: "Soins visage", icon: "🧴" },
  { key: "pedicure", name: "Pédicure", icon: "👣" },
  { key: "manicure", name: "Manucure", icon: "💅" },
  { key: "massage", name: "Massage", icon: "💆‍♀️" }
]

export default function BookAppointment() {
  /* ================== STATES ================== */
  const [date, setDate] = useState<Date>(new Date()) // ✅ aujourd’hui par défaut
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState("")
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)

  const [formData, setFormData] = useState({
    user_name: "",
    user_phone: "",
    service: ""
  })

  const isDark = document.documentElement.classList.contains("dark")

  /* ================== FETCH SLOTS ================== */
  const fetchSlots = async (selectedDate: Date) => {
    setSlotsLoading(true)
    setSelectedTime("")
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const result = await getPublicSlots(dateStr)
      setTimeSlots(result.available_slots || [])
    } catch {
      setTimeSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    fetchSlots(date)
  }, [date])

  /* ================== SUBMIT ================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.user_name || !formData.user_phone || !formData.service || !selectedTime) {
      return toast.error("Veuillez compléter tous les champs")
    }

    setLoading(true)
    try {
      await bookAppointment({
        ...formData,
        appointment_date: format(date, "yyyy-MM-dd"),
        appointment_time: selectedTime
      })
      toast.success("Rendez-vous réservé avec succès")
      setSuccessOpen(true)
      setFormData({ user_name: "", user_phone: "", service: "" })
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur lors de la réservation")
    } finally {
      setLoading(false)
    }
  }

  /* ================== UI ================== */
  return (
    <div
      className= "min-h-screen py-16 px-4"
    >
      <div className="max-w-2xl mx-auto">

        {/* ===== HEADER ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl  flex items-center justify-center shadow-xl">
            <CalendarIcon className="h-10 w-10 " />
          </div>
          <h1 className="text-4xl font-black mb-3">
            Prendre rendez-vous
          </h1>
          <p className="text-lg">
            Choisissez une date et un créneau disponible
          </p>
        </motion.div>

        {/* ===== CARD ===== */}
        <Card className="shadow-2l">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <UserCheck className="h-7 w-7" />
              Réservation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* ===== INFOS CLIENT ===== */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label><User className="inline mr-2 h-4 w-4" />Nom *</Label>
                  <Input
                    className="h-12"
                    value={formData.user_name}
                    onChange={(e) =>
                      setFormData({ ...formData, user_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label><Phone className="inline mr-2 h-4 w-4" />Téléphone *</Label>
                  <Input
                    className="h-12"
                    value={formData.user_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, user_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ===== SERVICE ===== */}
              <div>
                <Label><Briefcase className="inline mr-2 h-4 w-4" />Service *</Label>
                <Select
                  value={formData.service}
                  onValueChange={(v) =>
                    setFormData({ ...formData, service: v })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choisir un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        <span className="mr-2">{s.icon}</span> {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ===== DATE ===== */}
              <div>
                <Label><CalendarIcon className="inline mr-2 h-4 w-4" />Date *</Label>
                <Card className="mt-3 p-4 border-dashed border-2">
                  <Calendar
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    disabled={(d) => d < new Date()}
                    locale={fr}
                  />
                </Card>
              </div>

              {/* ===== HEURES ===== */}
              <div>
                <Label><Clock className="inline mr-2 h-4 w-4" />Heure *</Label>

                <div className="mt-3 min-h-[80px] flex items-center justify-center border rounded-lg">
                  {slotsLoading ? (
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                      Chargement des horaires...
                    </div>
                  ) : timeSlots.length === 0 ? (
                    <p>Aucun créneau disponible</p>
                  ) : (
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Choisir une heure" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* ===== SUBMIT ===== */}
              <Button
                type="submit"
                disabled={loading || slotsLoading}
                className="w-full h-14 text-lg font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    Réservation...
                  </>
                ) : (
                  "Réserver le rendez-vous"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ===== SUCCESS MODAL ===== */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Rendez-vous confirmé !
            </DialogTitle>
            <DialogDescription>
              Un SMS de confirmation vous a été envoyé.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setSuccessOpen(false)}>
              Nouveau RDV
            </Button>
            <Button onClick={() => (window.location.href = "/")}>
              <Home className="mr-2 h-4 w-4" /> Accueil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
