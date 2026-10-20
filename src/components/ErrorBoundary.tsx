import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  label?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Galaxy Ground] ${this.props.label ?? "Page"} crashed:`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="max-w-2xl mx-auto glass-panel p-6 text-center border border-destructive/30">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-foreground mb-1">
            {this.props.label ?? "This page"} failed to render
          </h2>
          <p className="text-xs text-muted-foreground mb-3">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-4 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
