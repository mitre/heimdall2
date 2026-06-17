import Vue from 'vue';

interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

const state: ConfirmDialogState = Vue.observable({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel'
});

let activeResolver: ((value: boolean) => void) | null = null;

export function confirm(options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}): Promise<boolean> {
  if (activeResolver) {
    activeResolver(false);
    activeResolver = null;
  }

  state.title = options.title;
  state.message = options.message;
  state.confirmText = options.confirmText ?? 'Confirm';
  state.cancelText = options.cancelText ?? 'Cancel';
  state.visible = true;

  return new Promise<boolean>((resolvePromise) => {
    activeResolver = resolvePromise;
  });
}

export function resolve(confirmed: boolean): void {
  state.visible = false;
  if (activeResolver) {
    activeResolver(confirmed);
    activeResolver = null;
  }
}

export {state as confirmDialogState};
