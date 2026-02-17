import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fef2f2'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Something went wrong</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '1rem' }}>
            The application encountered an error. Please check the browser console for details.
          </p>
          {this.state.error && (
            <details style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#fee2e2', 
              borderRadius: '8px',
              maxWidth: '600px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <pre style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.875rem', 
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              window.location.href = '/';
              localStorage.removeItem('agricultural_user');
            }}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;






