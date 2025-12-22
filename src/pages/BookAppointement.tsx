"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const services = [
  { key: "facial_care", name: "Soins visage" },
  { key: "pedicure", name: "Pédicure" },
  { key: "manicure", name: "Manucure" },
  { key: "massage", name: "Massage" }
]

export default function BookAppointment() {
  /* ================= STATES ================= */
  const [date, setDate] = useState<Date | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  const [slots, setSlots] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState("")
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    user_name: "",
    user_phone: "",
    service: ""
  })

  /* ================= FETCH SLOTS ================= */
  useEffect(() => {
    if (!date) return

    const fetchSlots = async () => {
      setSlotsLoading(true)
      setSlots([])
      setSelectedTime("")

      try {
        const res = await getPublicSlots(format(date, "yyyy-MM-dd"))
        setSlots(res.available_slots || [])
      } catch {
        setSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }

    fetchSlots()
  }, [date])

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.user_name || !form.user_phone || !form.service || !date || !selectedTime) {
      return toast.error("Veuillez remplir tous les champs")
    }

    setLoading(true)
    try {
      await bookAppointment({
        ...form,
        appointment_date: format(date, "yyyy-MM-dd"),
        appointment_time: selectedTime
      })

      toast.success("Rendez-vous confirmé")

      setForm({ user_name: "", user_phone: "", service: "" })
      setDate(null)
      setSelectedTime("")
    } catch {
      toast.error("Erreur lors de la réservation")
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <Card className="max-w-xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Prendre rendez-vous
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Nom */}
            <div>
              <Label>Nom complet</Label>
              <Input
                placeholder="Votre nom"
                value={form.user_name}
                onChange={(e) =>
                  setForm({ ...form, user_name: e.target.value })
                }
              />
            </div>

            {/* Téléphone */}
            <div>
              <Label>Téléphone</Label>
              <Input
                placeholder="+221..."
                value={form.user_phone}
                onChange={(e) =>
                  setForm({ ...form, user_phone: e.target.value })
                }
              />
            </div>

            {/* Service */}
            <div>
              <Label>Service</Label>
              <Select
                value={form.service}
                onValueChange={(v) => setForm({ ...form, service: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DATE */}
            <div className="space-y-2">
              <Label>Date</Label>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {date
                  ? format(date, "EEEE dd MMMM yyyy", { locale: fr })
                  : "Choisir une date"}
              </Button>

              {showCalendar && (
                <div className="border rounded-md p-2">
                  <Calendar
                    mode="single"
                    selected={date ?? undefined}
                    onSelect={(d) => {
                      if (!d) return
                      setDate(d)
                      setShowCalendar(false) // 👈 cache le calendrier
                    }}
                    disabled={(d) => d < new Date()}
                    locale={fr}
                  />
                </div>
              )}
            </div>

            {/* HEURES */}
            {date && (
              <div className="space-y-2">
                <Label>Heure</Label>

                {slotsLoading ? (
                  <Button disabled className="w-full">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement des créneaux...
                  </Button>
                ) : (
                  <Select
                    value={selectedTime}
                    onValueChange={setSelectedTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir l'heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.length === 0 ? (
                        <SelectItem disabled value="none">
                          Aucun créneau disponible
                        </SelectItem>
                      ) : (
                        slots.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* SUBMIT */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Réservation..." : "Confirmer le rendez-vous"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
