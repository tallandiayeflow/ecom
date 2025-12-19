import { Button } from '@/components/ui/button';
import { getBanners } from '@/lib/api';
import { BannerSlide } from '@/types';
import { ChevronLeft, ChevronRight, Loader2, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const BannerSlider = () => {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  // Utiliser setTimeout au lieu de setInterval pour plus de contrôle
  useEffect(() => {
    if (banners.length === 0 || isPaused) return;

    const autoSlide = () => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    timeoutRef.current = setTimeout(autoSlide, 5000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [banners.length, currentIndex, isPaused]);

  // Navigation au clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getBanners();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div 
      role="region" 
      aria-label="Bannières promotionnelles"
      aria-live="polite"
      className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden={index !== currentIndex}
          >
            <img
              src={banner.imageUrl || banner.product?.images?.[0] || banner.images?.[0]}
              alt={banner.title}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

            <div className="relative h-full flex items-center px-6 md:px-12">
              <div className="max-w-lg text-white space-y-2">
                <h2 className="text-xl md:text-3xl font-bold leading-tight">
                  {banner.title}
                </h2>
                <p className="text-sm md:text-lg text-gray-200">
                  {banner.subtitle}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate(`/products/${banner.productId}`)}
                  >
                    Découvrir
                  </Button>

                  {banner.product?.price && (
                    <span className="text-base md:text-xl font-bold" aria-label={`Prix: ${banner.product.price} Francs CFA`}>
                      {banner.product.price.toFixed(2)} Fcfa
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="absolute inset-0 flex items-center justify-between px-4 z-20 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          aria-label="Bannière précédente"
          className="pointer-events-auto bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Bouton Pause/Play */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePause}
          aria-label={isPaused ? 'Reprendre le défilement' : 'Mettre en pause'}
          className="pointer-events-auto absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          aria-label="Bannière suivante"
          className="pointer-events-auto bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5" role="tablist" aria-label="Navigation des bannières">
        {banners.map((banner, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            role="tab"
            aria-selected={index === currentIndex}
            aria-label={`Aller à la bannière ${index + 1}: ${banner.title}`}
            aria-controls={`banner-${index}`}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? 'w-5 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
