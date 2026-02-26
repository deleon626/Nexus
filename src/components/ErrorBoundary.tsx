import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <div className="bg-white p-4 rounded-lg shadow border border-red-200">
            <h2 className="font-semibold text-red-500 mb-2">Error:</h2>
            <pre className="text-sm bg-red-100 p-2 rounded overflow-auto">
              {this.state.error?.toString()}
            </pre>
            {this.state.errorInfo && (
              <>
                <h2 className="font-semibold text-red-500 mt-4 mb-2">Component Stack:</h2>
                <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
