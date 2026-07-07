import Vue from 'vue';

type ConfirmDialogState = {
  cancelText: string;
  confirmText: string;
  message: string;
  title: string;
  visible: boolean;
};

const state: ConfirmDialogState = Vue.observable({
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  message: '',
  title: '',
  visible: false,
});

let activeResolver: ((value: boolean) => void) | null = null;

export function confirm(options: {
  cancelText?: string;
  confirmText?: string;
  message: string;
  title: string;
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

export { state as confirmDialogState };
