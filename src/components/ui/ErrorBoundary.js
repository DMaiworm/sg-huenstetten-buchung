/**
 * ErrorBoundary – Fängt unbehandelte React-Fehler ab und zeigt
 * eine benutzerfreundliche Fehlerseite statt einer weißen Seite.
 *
 * Muss eine Klassenkomponente sein (React-Anforderung für Error Boundaries).
 *
 * Verwendung:
 *   <ErrorBoundary>
 *     <MeineKomponente />
 *   </ErrorBoundary>
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Fehler in der Konsole für Entwickler sichtbar lassen
    console.error('ErrorBoundary hat einen Fehler abgefangen:', error, info);
  }

  handleReload() {
    window.location.reload();
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            Etwas ist schiefgelaufen
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Ein unerwarteter Fehler ist aufgetreten. Bitte lade die Seite neu.
            Wenn das Problem anhält, wende dich an den Administrator.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.handleReset()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Erneut versuchen
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Seite neu laden
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
