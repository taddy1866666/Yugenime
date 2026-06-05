import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * 
 * How it works:
 * - Catches errors in child components
 * - Displays fallback UI instead of crashing
 * - Logs errors for debugging
 * 
 * Supervisor's note: "Implement this to prevent white screen crashes"
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Store error details
    this.setState({
      error,
      errorInfo
    });

    // Optional: Send to error tracking service (Sentry, etc)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Reset error boundary state
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <AlertTriangle size={48} className="error-icon" />
            <h1>Oops! Something went wrong</h1>
            <p>We encountered an unexpected error. Don't worry, we're here to help.</p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleReset} className="error-btn reset">
                <RefreshCw size={16} />
                Try Again
              </button>
              <button onClick={() => window.location.href = '/'} className="error-btn home">
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
