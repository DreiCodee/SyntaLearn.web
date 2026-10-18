/* =====================================================================
   PROTECT  -  stops copying and pasting so learners can't cheat
   ---------------------------------------------------------------------
   - text on the pages can't be selected or copied
   - nothing can be pasted into the answer boxes (typing still works)
   - right-click / long-press menu and drag-and-drop are turned off
   Note: this is a browser-side guard. It stops normal copy and paste,
   but nobody can fully lock a web page in someone's own browser.
   ===================================================================== */
(() => {
  'use strict';
  const typing = t => t && t.closest && t.closest('input, textarea');
  const stop = e => e.preventDefault();

  ['copy', 'cut', 'paste', 'contextmenu', 'dragstart', 'drop'].forEach(type => {
    document.addEventListener(type, e => {
      // the Arrange It / Fix the Order word chips use drag and drop, so allow those
      if ((type === 'dragstart' || type === 'drop') && e.target.closest && e.target.closest('.chip, .drop, #pool')) return;
      stop(e);
    }, true);
  });

  /* no selecting text with the mouse or a long press (the typing boxes are the exception) */
  document.addEventListener('selectstart', e => { if (!typing(e.target)) stop(e); }, true);

  /* keyboard shortcuts: copy, cut, paste, select all, view source, save, print */
  document.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a', 'u', 's', 'p'].includes(k)) stop(e);
    if (e.shiftKey && e.key === 'Insert') stop(e);   // Shift+Insert = paste
  }, true);
})();