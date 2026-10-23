// Command palette: ⌘K / Ctrl+K and "/". Combobox + listbox with aria-activedescendant.
import { $ } from './dom';

export interface Command { group: string; label: string | (() => string); hint?: string; run: () => void }

export function initPalette(commands: Command[], emptyText: string, beforeOpen: () => void, blockSlash: () => boolean) {
  const pal = $<HTMLDialogElement>('#palette');
  const input = $<HTMLInputElement>('#palInput');
  const list = $('#palList');
  if (!pal || !input || !list) return;

  let shown: Command[] = [];
  let active = 0;
  const lbl = (c: Command) => (typeof c.label === 'function' ? c.label() : c.label);

  const mark = () => {
    for (const o of list.querySelectorAll('.pal-opt')) o.setAttribute('aria-selected', String(o.id === `opt-${active}`));
    input.setAttribute('aria-activedescendant', `opt-${active}`);
    document.getElementById(`opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  };
  const run = (i: number) => {
    const c = shown[i];
    if (!c) return;
    pal.close();
    setTimeout(c.run, 10);
  };
  const render = () => {
    const q = input.value.trim().toLocaleLowerCase();
    shown = commands.filter((c) => `${lbl(c)} ${c.group}`.toLocaleLowerCase().includes(q));
    active = Math.min(active, Math.max(shown.length - 1, 0));
    list.replaceChildren();
    if (!shown.length) {
      const li = document.createElement('li');
      li.className = 'pal-empty';
      li.setAttribute('role', 'presentation');
      li.textContent = emptyText;
      list.append(li);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    let group = '';
    shown.forEach((c, i) => {
      if (c.group !== group) {
        group = c.group;
        const h = document.createElement('li');
        h.className = 'pal-group';
        h.setAttribute('role', 'presentation');
        h.textContent = group;
        list.append(h);
      }
      const li = document.createElement('li');
      li.className = 'pal-opt';
      li.id = `opt-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      const a = document.createElement('span');
      const b = document.createElement('span');
      a.textContent = lbl(c);
      b.textContent = c.hint ?? '';
      b.className = 'pal-hint';
      li.append(a, b);
      li.addEventListener('pointermove', () => { if (active !== i) { active = i; mark(); } });
      li.addEventListener('click', () => run(i));
      list.append(li);
    });
    input.setAttribute('aria-activedescendant', `opt-${active}`);
  };
  const open = () => {
    beforeOpen();
    input.value = '';
    active = 0;
    render();
    pal.showModal();
    input.focus();
  };

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    const n = Math.max(shown.length, 1);
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % n; mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + n) % n; mark(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
  });
  pal.addEventListener('click', (e) => { if (e.target === pal) pal.close(); });
  $('#openPalette')?.addEventListener('click', open);
  addEventListener('keydown', (e) => {
    const tag = (document.activeElement as HTMLElement | null)?.tagName ?? '';
    const typing = /INPUT|TEXTAREA|SELECT/.test(tag);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal.open) pal.close(); else open(); return; }
    if (e.key === '/' && !typing && !pal.open && !blockSlash()) { e.preventDefault(); open(); }
  });
}
