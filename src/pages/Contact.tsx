import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { sendContactMessage } from "@/lib/api";
import { motion } from "framer-motion";

const Contact = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendContactMessage(formData);
            toast.success("Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.");
            setFormData({
                name: "",
                email: "",
                phone: "",
                subject: "",
                message: "",
            });
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'envoi du message.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        {
            icon: <Phone className="h-6 w-6 text-primary" />,
            title: "Téléphone",
            value: "+221 77 123 45 67",
            description: "Lun-Sam de 9h à 19h",
        },
        {
            icon: <Mail className="h-6 w-6 text-primary" />,
            title: "Email",
            value: "contact@noor-boutique.com",
            description: "Réponse sous 24h",
        },
        {
            icon: <MapPin className="h-6 w-6 text-primary" />,
            title: "Boutique",
            value: "Dakar, Sénégal",
            description: "Quartier Sacré-Cœur 3",
        },
    ];

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Contactez-nous
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Une question sur nos Abayas ? Besoin d'un conseil personnalisé ?
                            Notre équipe est à votre écoute pour vous accompagner dans votre choix.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Info Side */}
                    <div className="lg:col-span-1 space-y-6">
                        {contactInfo.map((info, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <Card className="border-primary/10 bg-card/50 backdrop-blur-md hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-6 flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-primary/10">
                                            {info.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{info.title}</h3>
                                            <p className="text-primary font-medium">{info.value}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}

                        <Card className="border-primary/10 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Clock className="h-32 w-32" />
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Horaires d'ouverture
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 relative">
                                <div className="flex justify-between border-b border-white/20 pb-2">
                                    <span>Lundi - Vendredi</span>
                                    <span className="font-bold">09h00 - 19h00</span>
                                </div>
                                <div className="flex justify-between border-b border-white/20 pb-2">
                                    <span>Samedi</span>
                                    <span className="font-bold">10h00 - 18h00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dimanche</span>
                                    <span className="font-italic opacity-80">Fermé</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Form Side */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="border-primary/10 shadow-2xl overflow-hidden">
                            <div className="h-2 bg-primary" />
                            <CardHeader className="pb-4">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    Envoyez-nous un message
                                </CardTitle>
                                <p className="text-muted-foreground">
                                    Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nom Complet</Label>
                                            <Input
                                                id="name"
                                                placeholder="Votre nom"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="h-12 border-primary/20 focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="votre@email.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                className="h-12 border-primary/20 focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Téléphone (Optionnel)</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+221 ..."
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="h-12 border-primary/20 focus:border-primary"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Sujet</Label>
                                            <Input
                                                id="subject"
                                                placeholder="Sujet de votre message"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                required
                                                className="h-12 border-primary/20 focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Comment pouvons-nous vous aider ?"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            required
                                            className="min-h-[150px] border-primary/20 focus:border-primary"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 text-lg gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                >
                                                    <RefreshCw className="h-5 w-5" />
                                                </motion.div>
                                                Envoi en cours...
                                            </span>
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5" />
                                                Envoyer le message
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const RefreshCw = (props: any) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);

export default Contact;
