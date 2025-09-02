import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="glass-card mt-20 border-0 border-t border-glass-border/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 glass-surface rounded-xl">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gradient">DOMERYS</span>
                <span className="text-xs text-muted-foreground -mt-1">Turismo & Aventura</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Sua próxima aventura começa aqui. Descubra destinos incríveis 
              com todo o conforto e segurança que você merece.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Links Rápidos</h3>
            <nav className="space-y-2">
              {[
                { href: "/home", label: "Início" },
                { href: "/destinos", label: "Destinos" },
                { href: "/minhas-reservas", label: "Minhas Reservas" },
                { href: "/auth", label: "Entrar" }
              ].map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contato</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>(85) 9 9999-9999</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contato@domerys.com</span>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Redes Sociais</h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 glass-surface rounded-lg hover:glass-hover transition-all duration-200 hover:scale-105"
              >
                <Instagram className="h-4 w-4 text-primary" />
              </a>
              <a
                href="#"
                className="flex items-center justify-center w-10 h-10 glass-surface rounded-lg hover:glass-hover transition-all duration-200 hover:scale-105"
              >
                <Facebook className="h-4 w-4 text-primary" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-glass-border/30 mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 DOMERYS. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;