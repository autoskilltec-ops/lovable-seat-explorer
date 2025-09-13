import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, User, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  const navItems = isAdmin ? [
    { href: "/home", label: "Início" },
    { href: "/destinos", label: "Destinos" },
    { href: "/admin", label: "Admin" }
  ] : [
    { href: "/home", label: "Início" },
    { href: "/destinos", label: "Destinos" },
    { href: "/minhas-reservas", label: "Minhas Reservas" }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between glass-card border-0 border-glass-border/30 px-4 py-3" style={{ borderRadius: "5%" }}>
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-10 h-10 glass-surface rounded-xl group-hover:scale-105 transition-transform duration-200">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gradient">DOMERYS</span>
              <span className="text-xs text-muted-foreground -mt-1">Turismo & Aventura</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className={`glass-surface border-0 hover:glass-hover transition-all duration-200 ${
                  isActive(item.href) ? 'glass-button text-primary-foreground' : ''
                }`}
              >
                <Link to={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          {/* User Menu & Mobile Menu */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="glass-surface border-0 hover:glass-hover hidden sm:flex"
            >
              <User className="h-4 w-4 mr-2" />
              Minha Conta
            </Button>

            {user && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 glass-surface border-0 hover:glass-hover hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
              >
                Sair
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="glass-surface border-0 hover:glass-hover md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="glass-card p-6 space-y-4">
                  <div className="pb-4 border-b border-glass-border/30">
                    <h2 className="text-lg font-semibold text-gradient">Menu</h2>
                  </div>
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        asChild
                        className={`w-full justify-start glass-surface border-0 hover:glass-hover ${
                          isActive(item.href) ? 'glass-button text-primary-foreground' : ''
                        }`}
                      >
                        <Link to={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </nav>
                  <div className="pt-4 border-t border-glass-border/30">
                    <Button className="w-full glass-button border-0">
                      <User className="h-4 w-4 mr-2" />
                      Minha Conta
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;