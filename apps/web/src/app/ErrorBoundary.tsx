import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error", { error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                AetherMind encountered an unexpected error. Reload the application to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={this.handleReload}>Reload application</Button>
            </CardContent>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

