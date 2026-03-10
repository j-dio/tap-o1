"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // In production, this could report to an error tracking service
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = process.env.NODE_ENV === "development";

    return (
      <Card className="border-destructive/30 mx-auto mt-12 max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-sm">
              {isDev && this.state.error
                ? this.state.error.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <Button size="sm" onClick={this.handleReset}>
            <RefreshCw className="mr-1.5 size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }
}
