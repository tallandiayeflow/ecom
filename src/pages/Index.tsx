import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { getProducts } from '@/lib/api';
import { BannerSlider } from '@/components/BannerSlider';
import { CategorySlider } from '@/components/CategorySlider';
import { FlashSaleSection } from '@/components/FlashSaleSection';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const { products } = await getProducts({ limit: 4 });
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Banner Section */}
      <section className="container mx-auto px-4 py-8">
        <BannerSlider />
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Catégories</h2>
        <CategorySlider />
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Produits Populaires</h2>
            <p className="text-muted-foreground">Découvrez nos meilleures ventes</p>
          </div>
          <Button onClick={() => navigate('/products')} variant="outline">
            Voir tout <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Flash Sales Section */}
      <section className="container mx-auto px-4 py-12 bg-gradient-subtle rounded-xl">
        <FlashSaleSection />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: '🚚',
              title: 'Livraison Rapide',
              description: 'Recevez vos produits en 24-48h',
            },
            {
              icon: '🔒',
              title: 'Paiement Sécurisé',
              description: 'Vos données sont protégées',
            },
            {
              icon: '🎁',
              title: 'Programme Fidélité',
              description: 'Gagnez des points à chaque achat',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
