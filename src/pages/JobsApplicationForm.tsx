"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitJobApplication } from "@/lib/api"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle, FileText, Loader2 } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

const JobApplicationForm = () => {

  const navigate = () => {
    window.location.href = '/'
  }
  // States
  const [formData, setFormData] = useState(new FormData())
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Champs form
  const fullName = formData.get('full_name') as string || ''
  const phone = formData.get('phone') as string || ''
  const email = formData.get('email') as string || ''
  const desiredPosition = formData.get('desired_position') as string || ''
  const cvFile = formData.get('cv') as File | null

  // Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    
    if (!fullName.trim()) newErrors.full_name = "Nom complet requis"
    if (!phone.trim()) newErrors.phone = "Téléphone requis"
    else if (!/^\+?\d{10,15}$/.test(phone.replace(/\D/g, ''))) newErrors.phone = "Format téléphone invalide"
    
    if (!email.trim()) newErrors.email = "Email requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Email invalide"
    
    if (!desiredPosition.trim()) newErrors.desired_position = "Poste souhaité requis"
    
    if (!cvFile) newErrors.cv = "CV requis"
    else if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(cvFile.type)) {
      newErrors.cv = "Format CV invalide (PDF, DOC, DOCX)"
    } else if (cvFile.size > 8 * 1024 * 1024) {
      newErrors.cv = "CV trop volumineux (max 8MB)"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const result = await submitJobApplication(formData)
      toast.success("✅ Candidature envoyée avec succès !", {
        description: "Votre CV est en attente de validation par l'admin"
      })
      setSubmitted(true)
      formRef.current?.reset()
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFormData(new FormData())
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erreur lors de l'envoi"
      toast.error("❌ Erreur", {
        description: errorMsg
      })
      setErrors({ submit: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  // Update FormData
  const updateFormData = (key: string, value: string | File | null) => {
    const newFormData = new FormData()
    formData.forEach((value, key) => newFormData.append(key, value))
    if (value !== null && value !== '') {
      newFormData.set(key, value as any)
    } else {
      newFormData.delete(key)
    }
    setFormData(newFormData)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Candidature envoyée !</CardTitle>
            <CardDescription className="text-green-700">
              Votre CV a été soumis avec succès. Notre équipe vous contactera sous peu.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => navigate()}
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  py-12 px-4"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
            <span className="text-xl font-bold text-white">Postuler</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Rejoignez notre équipe
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Envoyez votre candidature et CV. Nous examinerons votre profil dans les plus brefs délais.
          </p>
        </motion.div>

        {/* Formulaire */}
        <Card className="shadow-2xl border-0 ">
          <CardHeader className=" pb-8">
            <CardTitle className="text-2xl flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              Formulaire de candidature
            </CardTitle>
            <CardDescription>
              Tous les champs sont obligatoires. Formats acceptés : PDF, DOC, DOCX (max 8MB)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-0">
            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}
            
            <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Nom complet */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet <span className="text-red-500">*</span></Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Ex: Mamadou Diop"
                  value={fullName}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                  className={errors.full_name ? "border-red-500 focus:border-red-500" : ""}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Téléphone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+221 77 123 45 67"
                    value={phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className={errors.phone ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className={errors.email ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Poste souhaité */}
              <div className="space-y-2">
                <Label htmlFor="desired_position">Poste souhaité <span className="text-red-500">*</span></Label>
                <Textarea
                  id="desired_position"
                  name="desired_position"
                  placeholder="Ex: Développeur Fullstack, Commercial, etc..."
                  value={desiredPosition}
                  onChange={(e) => updateFormData('desired_position', e.target.value)}
                  className={errors.desired_position ? "border-red-500 focus:border-red-500" : ""}
                  rows={3}
                />
                {errors.desired_position && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.desired_position}
                  </p>
                )}
              </div>

              {/* CV */}
              <div className="space-y-2">
                <Label htmlFor="cv">CV <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="cv"
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      updateFormData('cv', file)
                    }}
                    className={errors.cv ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {cvFile && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-green-600 font-medium">
                      ✅ {cvFile.name.slice(0, 30)}{cvFile.name.length > 30 ? '...' : ''}
                    </div>
                  )}
                </div>
                {errors.cv && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.cv}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Formats acceptés : PDF, DOC, DOCX (Max 8MB)
                </p>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                disabled={loading || submitted}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Postuler maintenant
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

export default JobApplicationForm
