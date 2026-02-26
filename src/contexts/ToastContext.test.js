import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from './ToastContext';

// Hilfskomponente, die useToast nutzt
function ToastTrigger({ message, type }) {
  const { addToast } = useToast();
  return (
    <button onClick={() => addToast(message, type)}>Toast auslösen</button>
  );
}

function renderWithProvider(ui) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ── useToast außerhalb Provider ─────────────────────────────
describe('useToast', () => {
  it('wirft Fehler wenn außerhalb von ToastProvider verwendet', () => {
    // Konsolenausgabe für den erwarteten Fehler unterdrücken
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    function BadComponent() {
      useToast();
      return null;
    }
    expect(() => render(<BadComponent />)).toThrow(
      'useToast muss innerhalb von ToastProvider verwendet werden'
    );
    consoleError.mockRestore();
  });
});

// ── addToast ────────────────────────────────────────────────
describe('addToast', () => {
  it('zeigt Toast-Nachricht nach addToast an', () => {
    renderWithProvider(<ToastTrigger message="Test-Nachricht" type="success" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Test-Nachricht')).toBeInTheDocument();
  });

  it('zeigt mehrere Toasts gleichzeitig an', () => {
    function MultiTrigger() {
      const { addToast } = useToast();
      return (
        <>
          <button onClick={() => addToast('Erster Toast', 'success')}>Erster</button>
          <button onClick={() => addToast('Zweiter Toast', 'error')}>Zweiter</button>
        </>
      );
    }
    renderWithProvider(<MultiTrigger />);
    fireEvent.click(screen.getByText('Erster'));
    fireEvent.click(screen.getByText('Zweiter'));
    expect(screen.getByText('Erster Toast')).toBeInTheDocument();
    expect(screen.getByText('Zweiter Toast')).toBeInTheDocument();
  });

  it('verwendet info als Standardtyp', () => {
    function DefaultTypeTrigger() {
      const { addToast } = useToast();
      return <button onClick={() => addToast('Info-Meldung')}>Auslösen</button>;
    }
    renderWithProvider(<DefaultTypeTrigger />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Info-Meldung')).toBeInTheDocument();
  });
});

// ── Auto-Dismiss ─────────────────────────────────────────────
describe('Auto-Dismiss', () => {
  it('entfernt Toast automatisch nach 4 Sekunden', async () => {
    renderWithProvider(<ToastTrigger message="Verschwindet bald" type="info" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Verschwindet bald')).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(4000); });

    await waitFor(() => {
      expect(screen.queryByText('Verschwindet bald')).not.toBeInTheDocument();
    });
  });

  it('bleibt sichtbar vor dem Timeout', () => {
    renderWithProvider(<ToastTrigger message="Noch sichtbar" type="info" />);
    fireEvent.click(screen.getByRole('button'));

    act(() => { jest.advanceTimersByTime(3999); });

    expect(screen.getByText('Noch sichtbar')).toBeInTheDocument();
  });
});

// ── Manuelles Schließen ──────────────────────────────────────
describe('Manuelles Schließen', () => {
  it('entfernt Toast beim Klick auf Schließen-Button', () => {
    renderWithProvider(<ToastTrigger message="Schließbar" type="warning" />);
    fireEvent.click(screen.getByRole('button', { name: 'Toast auslösen' }));
    expect(screen.getByText('Schließbar')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Meldung schließen' }));
    expect(screen.queryByText('Schließbar')).not.toBeInTheDocument();
  });
});

// ── role="alert" ─────────────────────────────────────────────
describe('Barrierefreiheit', () => {
  it('Toast hat role="alert"', () => {
    renderWithProvider(<ToastTrigger message="Alert-Meldung" type="error" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
