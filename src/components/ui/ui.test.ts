import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('UI components exports', () => {
  it('garante que todos os módulos visuais compilam e exportam os tipos corretos', async () => {
    const paperSurface = await import('./PaperSurface.js');
    const paperButton = await import('./PaperButton.js');
    const inkStamp = await import('./InkStamp.js');
    const paperDialog = await import('./PaperDialog.js');
    const formField = await import('./FormField.js');
    const notice = await import('./Notice.js');
    const emptyState = await import('./EmptyState.js');

    assert.ok(paperSurface.PaperSurface);
    assert.ok(paperButton.PaperButton);
    assert.ok(inkStamp.InkStamp);
    assert.ok(paperDialog.PaperDialog);
    assert.ok(formField.FormField);
    assert.ok(notice.Notice);
    assert.ok(emptyState.EmptyState);
  });
});
