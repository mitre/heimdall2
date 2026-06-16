import {describe, expect, it} from 'vitest';
import {InspecDataModule, UNSAVED_CHANGES_MESSAGE} from '@/store/data_store';

describe('data_store editing', () => {
  describe('dirty tracking', () => {
    it('hasUnsavedFiles reflects dirty state', () => {
      const id = `dirty-test-${Date.now()}-1`;
      InspecDataModule.markFileDirty(id);
      expect(InspecDataModule.hasUnsavedFiles).toBe(true);
      expect(InspecDataModule.isFileDirty(id)).toBe(true);
      InspecDataModule.markFileSaved([id]);
      expect(InspecDataModule.isFileDirty(id)).toBe(false);
    });

    it('isFileDirty returns false for unknown file IDs', () => {
      expect(InspecDataModule.isFileDirty('nonexistent-file-id')).toBe(false);
    });

    it('markFileSaved accepts array and removes multiple files', () => {
      const id1 = `saved-test-${Date.now()}-a`;
      const id2 = `saved-test-${Date.now()}-b`;
      InspecDataModule.markFileDirty(id1);
      InspecDataModule.markFileDirty(id2);
      expect(InspecDataModule.isFileDirty(id1)).toBe(true);
      expect(InspecDataModule.isFileDirty(id2)).toBe(true);
      InspecDataModule.markFileSaved([id1, id2]);
      expect(InspecDataModule.isFileDirty(id1)).toBe(false);
      expect(InspecDataModule.isFileDirty(id2)).toBe(false);
    });

    it('markFileDirty is idempotent — adding same ID twice does not duplicate', () => {
      const id = `idempotent-test-${Date.now()}`;
      InspecDataModule.markFileDirty(id);
      InspecDataModule.markFileDirty(id);
      InspecDataModule.markFileSaved([id]);
      expect(InspecDataModule.isFileDirty(id)).toBe(false);
    });

    it('clearDirtyFiles removes all dirty state', () => {
      const id1 = `clear-test-${Date.now()}-a`;
      const id2 = `clear-test-${Date.now()}-b`;
      InspecDataModule.markFileDirty(id1);
      InspecDataModule.markFileDirty(id2);
      InspecDataModule.clearDirtyFiles();
      expect(InspecDataModule.isFileDirty(id1)).toBe(false);
      expect(InspecDataModule.isFileDirty(id2)).toBe(false);
    });
  });

  describe('UNSAVED_CHANGES_MESSAGE', () => {
    it('is a non-empty string constant', () => {
      expect(typeof UNSAVED_CHANGES_MESSAGE).toBe('string');
      expect(UNSAVED_CHANGES_MESSAGE.length).toBeGreaterThan(0);
    });
  });
});
