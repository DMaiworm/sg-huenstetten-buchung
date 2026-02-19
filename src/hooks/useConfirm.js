import React, { useState, useCallback } from 'react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

/**
 * useConfirm – Hook-basierter Ersatz für window.confirm().
 *
 * Nutzung:
 *   const [confirm, ConfirmDialogEl] = useConfirm();
 *
 *   const handleDelete = async () => {
 *     if (await confirm({ title: 'Löschen?', message: 'Wirklich löschen?' })) {
 *       // Löschen...
 *     }
 *   };
 *
 *   return <>{...}{ConfirmDialogEl}</>;
 */
export function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback(({ title, message, confirmLabel, cancelLabel, variant } = {}) => {
    return new Promise(resolve => {
      setState({ title, message, confirmLabel, cancelLabel, variant, resolve });
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
