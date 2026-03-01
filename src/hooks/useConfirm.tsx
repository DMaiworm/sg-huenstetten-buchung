import React, { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { ConfirmOptions } from '../types';

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * useConfirm – Hook-basierter Ersatz für window.confirm().
 */
export function useConfirm(): [(options?: ConfirmOptions) => Promise<boolean>, React.ReactElement | null] {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions = {}) => {
    return new Promise<boolean>(resolve => {
      setState({ ...options, resolve });
    });
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      onConfirm={() => { const r = state.resolve; setState(null); r(true); }}
      onCancel={() => { const r = state.resolve; setState(null); r(false); }}
    />
  ) : null;

  return [confirm, dialog];
}
