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
            background: "linear-gradient(135deg, #3B1D5A 0%, #2a1443 100%)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "24px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "48px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#F47C20",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                fontSize: "32px",
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: 800,
                color: "#3B1D5A",
                marginBottom: "12px",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                marginBottom: "32px",
                lineHeight: 1.5,
              }}
            >
              Something went wrong. Please refresh the page.
            </p>
            <button
              onClick={this.handleRefresh}
              style={{
                background: "#F47C20",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "16px 48px",
                fontSize: "18px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "transform 0.1s, box-shadow 0.1s",
                boxShadow: "0 4px 12px rgba(244,124,32,0.4)",
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.transform = "scale(1.05)";
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
