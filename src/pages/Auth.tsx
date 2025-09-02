import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Mail, Lock, User, Chrome } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Placeholder para futura implementação de autenticação
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Em Breve!",
        description: "Sistema de autenticação será implementado na próxima etapa.",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center justify-center w-12 h-12 glass-surface rounded-xl">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gradient">DOMERYS</span>
              <span className="text-sm text-muted-foreground -mt-1">Turismo & Aventura</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gradient">
            Bem-vindo de Volta
          </h1>
          <p className="text-muted-foreground">
            Entre na sua conta ou crie uma nova para continuar
          </p>
        </div>

        {/* Auth Forms */}
        <Card className="glass-card p-8 border-0">
          <Tabs defaultValue="login" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 glass-surface border-0">
              <TabsTrigger 
                value="login"
                className="data-[state=active]:glass-button data-[state=active]:text-primary-foreground"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register"
                className="data-[state=active]:glass-button data-[state=active]:text-primary-foreground"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      type="email" 
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password"
                      type="password" 
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full glass-button border-0"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="text-center">
                <a 
                  href="#" 
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name"
                      type="text" 
                      placeholder="Seu nome completo"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-foreground">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="register-email"
                      type="email" 
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="register-password"
                      type="password" 
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full glass-button border-0"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>

            {/* Social Login */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-glass-border/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-glass px-2 text-muted-foreground">ou continue com</span>
                </div>
              </div>

              <Button 
                variant="outline"
                className="w-full glass-surface border-glass-border/50 hover:glass-hover"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
          </Tabs>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Ao continuar, você concorda com nossos{" "}
          <a href="#" className="text-primary hover:text-primary-hover transition-colors">
            Termos de Serviço
          </a>{" "}
          e{" "}
          <a href="#" className="text-primary hover:text-primary-hover transition-colors">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;