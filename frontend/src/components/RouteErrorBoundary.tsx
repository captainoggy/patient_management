import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { error: Error | null };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="alert alert-error" role="alert">
          <p>Something went wrong loading this screen.</p>
          <p className="muted route-error-detail">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
