import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * LoginPage – E-Mail/Passwort Login für SG Hünstetten Buchungssystem.
 * Wird angezeigt wenn kein User eingeloggt ist.
 */
export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SG Hünstetten</h1>
          <p className="text-gray-500 mt-1 text-sm">Buchungssystem für Sportstätten</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Anmelden</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-Mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@sg-huenstetten.de"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Passwort */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Fehlermeldung */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {translateError(error)}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Anmelden...
                </>
              ) : 'Anmelden'}
            </button>
          </form>

          {/* Hinweis */}
          <p className="mt-6 text-xs text-gray-400 text-center">
            Zugang nur auf Einladung. Bei Fragen wende dich an den Administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Übersetzt Supabase Auth-Fehlermeldungen ins Deutsche. */
function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort ist falsch.';
  if (msg.includes('Email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (msg.includes('Too many requests')) return 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.';
  if (msg.includes('User not found')) return 'Kein Konto mit dieser E-Mail-Adresse gefunden.';
  return msg;
}
