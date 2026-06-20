export interface PopupOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function showPopup(options: PopupOptions) {
  const event = new CustomEvent("show-global-popup", { detail: options });
  window.dispatchEvent(event);
}

export const popup = {
  success: (message: string, title = "Operazione Completata") => showPopup({ type: 'success', title, message }),
  error: (message: string, title = "Spiacenti") => showPopup({ type: 'error', title, message }),
  info: (message: string, title = "Suggerimento") => showPopup({ type: 'info', title, message }),
  confirm: (message: string, onConfirm: () => void, title = "Conferma Richiesta", onCancel?: () => void) => {
    showPopup({
      type: 'warning',
      title,
      message,
      confirmLabel: "Conferma",
      cancelLabel: "Annulla",
      onConfirm,
      onCancel
    });
  }
};
