import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <Header />
        {user && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-2 glass-surface border-0 hover:glass-hover hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        )}
      </div>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;