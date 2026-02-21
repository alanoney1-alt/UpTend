import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFBF5",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              padding: "48px 40px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 8px 24px rgba(28,25,23,0.12), 0 4px 8px rgba(28,25,23,0.04)",
              border: "1px solid #E7E5E4",
            }}
          >
            {/* George Avatar */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
                border: "3px solid #F97316",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "40px",
              }}
            >
              🏠
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: "#292524",
                marginBottom: "8px",
              }}
            >
              Oops, something went wrong
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#78716C",
                marginBottom: "32px",
                lineHeight: 1.6,
              }}
            >
              Mr. George is on it! Let me fix that for you...
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: "#F97316",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  padding: "14px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 12px rgba(249,115,22,0.3)",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.background = "#EA580C";
                  (e.target as HTMLButtonElement).style.transform = "scale(1.02)";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.background = "#F97316";
                  (e.target as HTMLButtonElement).style.transform = "scale(1)";
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                style={{
                  background: "white",
                  color: "#57534E",
                  border: "2px solid #E7E5E4",
                  borderRadius: "16px",
                  padding: "14px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "#F97316";
                  (e.target as HTMLButtonElement).style.color = "#F97316";
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = "#E7E5E4";
                  (e.target as HTMLButtonElement).style.color = "#57534E";
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
