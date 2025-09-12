import React from 'react';
import { Button } from './button';
import { Card } from './card';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card p-8 border-0 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 glass-surface rounded-full flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        
        <h2 className="text-2xl font-bold text-gradient mb-4">
          Ops! Algo deu errado
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        
        {error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
              Detalhes do erro
            </summary>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="flex gap-4 justify-center">
          <Button onClick={resetError} className="glass-button border-0">
            Tentar novamente
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="glass-surface border-glass-border/50"
          >
            Voltar ao início
          </Button>
        </div>
      </Card>
    </div>
  );
};