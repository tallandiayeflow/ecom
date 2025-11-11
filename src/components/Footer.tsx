import { Link } from 'react-router-dom';
import { Smartphone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold">PhoneShop</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre destination #1 pour les derniers smartphones, tablettes et accessoires. 
              Qualité garantie et livraison rapide.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Facebook className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Twitter className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Instagram className="h-4 w-4 text-primary" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Youtube className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens Rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Tous les Produits
                </Link>
              </li>
              <li>
                <Link to="/products?category=iphone" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  iPhones
                </Link>
              </li>
              <li>
                <Link to="/products?category=android" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Android
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Accessoires
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Mes Commandes
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Service Client</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Centre d'Aide
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Politique de Retour
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Garantie
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Conditions d'Utilisation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Politique de Confidentialité
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contactez-Nous</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">
                  123 Avenue des Champs-Élysées<br />
                  75008 Paris, France
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:contact@phoneshop.fr" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  contact@phoneshop.fr
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="tel:+33123456789" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  +33 1 23 45 67 89
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} PhoneShop. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Mentions Légales
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Plan du Site
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
