import { BannerSlider } from '@/components/BannerSlider';
import { CategorySlider } from '@/components/CategorySlider';
import { FlashSaleSection } from '@/components/FlashSaleSection';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/lib/api';
import { Product } from '@/types';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const { products } = await getProducts({ limit: 10 });
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner Section */}
      <section className="container mx-auto px-4 pt-4 pb-8 md:pt-8 md:pb-12">
        <div className="animate-fade-in">
          <BannerSlider />
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Explorez nos Catégories
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Découvrez notre large gamme de produits pour tous vos besoins technologiques
            </p>
          </div>
          <CategorySlider />
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Produits Populaires</h2>
              <p className="text-muted-foreground text-lg">Les favoris de nos clients</p>
            </div>
            <Button 
              onClick={() => navigate('/products')} 
              variant="default"
              size="lg"
              className="gap-2 group"
            >
              Voir tout 
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, idx) => (
              <div 
                key={product.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sales Section */}
      <section className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 py-16">
        <div className="container mx-auto px-4">
          <div className="animate-fade-in">
            <FlashSaleSection />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Pourquoi Nous Choisir?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Une expérience d'achat exceptionnelle à chaque commande
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🚚',
              title: 'Livraison Rapide',
              description: 'Recevez vos produits en 24-48h partout en France',
              color: 'from-blue-500/10 to-blue-600/10',
            },
            {
              icon: '🔒',
              title: 'Paiement Sécurisé',
              description: 'Vos données sont protégées avec un cryptage SSL',
              color: 'from-green-500/10 to-green-600/10',
            },
            {
              icon: '🎁',
              title: 'Programme Fidélité',
              description: 'Gagnez des points à chaque achat et obtenez des récompenses',
              color: 'from-purple-500/10 to-purple-600/10',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative flex flex-col items-center text-center p-8 rounded-2xl border bg-card hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-r from-primary/90 to-primary py-20">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center animate-fade-in">

      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
        Et maintenant ?
      </h2>

      <p className="text-primary-foreground/90 text-lg mb-12">
        Vous souhaitez rejoindre notre équipe ou prendre rendez-vous dans notre institut ?
      </p>

      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        
        {/* Candidature */}
        <a
          href="/jobs-application"
          className="group rounded-2xl bg-white/10 backdrop-blur-md p-8 text-left hover:bg-white/20 transition shadow-lg"
        >
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-primary-foreground mb-2 group-hover:underline">
            Déposer une candidature
          </h3>
          <p className="text-primary-foreground/80">
            Envoyez votre CV et rejoignez notre équipe professionnelle
          </p>
        </a>

        {/* Rendez-vous */}
        <a
          href="/book-appointment"
          className="group rounded-2xl bg-white/10 backdrop-blur-md p-8 text-left hover:bg-white/20 transition shadow-lg"
        >
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-bold text-primary-foreground mb-2 group-hover:underline">
            Prendre un rendez-vous
          </h3>
          <p className="text-primary-foreground/80">
            Réservez facilement un créneau dans notre institut
          </p>
        </a>

      </div>
    </div>
  </div>
</section>

    </div>
  );
};

export default Index;
