import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ui] Unhandled error', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="page narrow error-state" role="alert">
        <h1>Something went wrong</h1>
        <p>This part of the page failed to load. You can still browse the menu and order.</p>
        <div className="row gap">
          <a className="btn" href="/menu">
            Open the menu
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
