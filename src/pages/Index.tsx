import { BannerSlider } from "@/components/BannerSlider";
import { CategorySlider } from "@/components/CategorySlider";
import { FlashSaleSection } from "@/components/FlashSaleSection";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts } from "@/lib/api";
import { Product } from "@/types";
import { motion } from "framer-motion";
import { ArrowRight, Package, Shield, Star, Truck, Zap, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: EASE } }),
};

const STATS = [
  { value: "500+", label: "Produits", icon: Package },
  { value: "2 000+", label: "Clients satisfaits", icon: Star },
  { value: "24h", label: "Livraison Dakar", icon: Truck },
  { value: "100%", label: "Paiement sécurisé", icon: Shield },
];

const FEATURES = [
  {
    icon: Truck,
    emoji: "🚚",
    title: "Livraison Rapide",
    description: "Livraison express 24h à Dakar et dans tout le Sénégal",
    accent: "from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  {
    icon: Shield,
    emoji: "🔒",
    title: "Paiement Sécurisé",
    description: "Wave, Orange Money, carte bancaire — 100% sécurisé",
    accent: "from-emerald-500/20 to-green-500/10",
    iconColor: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  {
    icon: Star,
    emoji: "🎁",
    title: "Programme Fidélité",
    description: "Gagnez des points à chaque achat et obtenez des récompenses exclusives",
    accent: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-600",
    bg: "bg-violet-500/10",
  },
];

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    setLoading(true);
    try {
      const { products } = await getProducts({ limit: 8 });
      setFeaturedProducts(products);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── HERO BANNER ── */}
      <section className="container mx-auto px-4 pt-4 pb-8 md:pt-6 md:pb-10">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }}>
          <BannerSlider />
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ── */}
      <section className="py-14 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Collections</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Explorez nos Catégories
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Des produits soigneusement sélectionnés pour vous
            </p>
          </motion.div>
          <CategorySlider />
        </div>
      </section>

      {/* ── PRODUITS POPULAIRES ── */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Tendances</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Produits Populaires
            </h2>
            <p className="text-muted-foreground mt-2">Les favoris de nos clients</p>
          </motion.div>
          <motion.div variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Button onClick={() => navigate("/products")} variant="outline" size="lg" className="gap-2 group rounded-xl">
              Tout voir
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                custom={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
              >
                <ProductCard product={product} index={idx} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ── VENTES FLASH ── */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-primary/8 to-accent/5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-destructive uppercase">Offres Limitées</p>
                <h2 className="text-2xl md:text-3xl font-bold">Ventes Flash</h2>
              </div>
            </div>
            <FlashSaleSection />
          </motion.div>
        </div>
      </section>

      {/* ── POURQUOI NOUS ── */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">Nos Engagements</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Pourquoi Choisir NOOR ?</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Une expérience d'achat pensée pour vous
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                custom={idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border bg-card p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                <div className="relative">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} mb-6 text-2xl`}>
                    {feature.emoji}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── CTA CONTACT ── */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-64 h-64 rounded-full border-[40px] border-white/30" />
          <div className="absolute bottom-8 right-8 w-96 h-96 rounded-full border-[60px] border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-[30px] border-white/25" />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
              <MessageCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-primary-foreground leading-tight">
              Une question ?<br />On est là pour vous.
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Notre équipe est disponible pour vous aider à trouver le produit parfait ou suivre votre commande.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-xl h-13 px-8 font-semibold text-base shadow-xl"
                onClick={() => navigate("/contact")}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Nous contacter
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-xl h-13 px-8 font-semibold text-base backdrop-blur-sm"
                onClick={() => navigate("/products")}
              >
                Voir le catalogue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Index;
