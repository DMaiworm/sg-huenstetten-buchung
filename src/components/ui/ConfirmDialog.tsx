import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

const VARIANT_STYLES: Record<ConfirmVariant, { iconColor: string; iconBg: string; btnVariant: 'danger' | 'primary' }> = {
  danger:  { iconColor: 'text-red-500',    iconBg: 'bg-red-100',    btnVariant: 'danger' },
  warning: { iconColor: 'text-yellow-600', iconBg: 'bg-yellow-100', btnVariant: 'primary' },
  info:    { iconColor: 'text-blue-500',   iconBg: 'bg-blue-100',   btnVariant: 'primary' },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  title = 'Sind Sie sicher?',
  message,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'danger',
}) => {
  if (!open) return null;

  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.danger;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle className={`w-5 h-5 ${style.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {message && <p className="text-sm text-gray-600">{message}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={style.btnVariant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
