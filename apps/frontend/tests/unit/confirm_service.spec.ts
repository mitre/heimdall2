import { describe, expect, it } from 'vitest';
import { confirm, confirmDialogState, resolve } from '@/utilities/confirm_service';

describe('confirm_service', () => {
  it('confirm() sets visible state and returns a Promise', () => {
    const promise = confirm({
      message: 'Test message',
      title: 'Test Title',
    });

    expect(confirmDialogState.visible).toBe(true);
    expect(confirmDialogState.title).toBe('Test Title');
    expect(confirmDialogState.message).toBe('Test message');
    expect(promise).toBeInstanceOf(Promise);

    resolve(false);
  });

  it('resolve(true) resolves the promise with true and hides dialog', async () => {
    const promise = confirm({
      message: 'Are you sure?',
      title: 'Confirm',
    });

    expect(confirmDialogState.visible).toBe(true);

    resolve(true);

    const isResult = await promise;
    expect(isResult).toBe(true);
    expect(confirmDialogState.visible).toBe(false);
  });

  it('resolve(false) resolves the promise with false', async () => {
    const promise = confirm({
      message: 'Will cancel',
      title: 'Cancel test',
    });

    resolve(false);

    const isResult = await promise;
    expect(isResult).toBe(false);
    expect(confirmDialogState.visible).toBe(false);
  });

  it('uses custom button text when provided', () => {
    confirm({
      cancelText: 'Stay',
      confirmText: 'Discard',
      message: 'Custom buttons',
      title: 'Custom',
    });

    expect(confirmDialogState.confirmText).toBe('Discard');
    expect(confirmDialogState.cancelText).toBe('Stay');

    resolve(false);
  });

  it('defaults button text when not provided', () => {
    confirm({
      message: 'Default buttons',
      title: 'Defaults',
    });

    expect(confirmDialogState.confirmText).toBe('Confirm');
    expect(confirmDialogState.cancelText).toBe('Cancel');

    resolve(false);
  });

  it('second confirm() call supersedes the first (latest wins)', async () => {
    const first = confirm({ message: 'First', title: 'First' });
    const second = confirm({ message: 'Second', title: 'Second' });

    expect(confirmDialogState.title).toBe('Second');

    resolve(true);

    const isSecondResult = await second;
    expect(isSecondResult).toBe(true);

    const isFirstResult = await first;
    expect(isFirstResult).toBe(false);
  });
});
