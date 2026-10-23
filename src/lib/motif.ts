// Per-project SVG motif (from the prototype's hover preview). Used by the preview (client) and the
// case-study page header (server). Colours come from CSS: currentColor = text, class "a" = accent.
export type Motif = 'lines' | 'blocks' | 'rings' | 'grid' | 'wave';

export function motifSvg(kind: string): string {
  let s = '';
  if (kind === 'lines') {
    for (let i = 0; i < 8; i++) {
      const y = 22 + i * 19, w = 90 + ((i * 53) % 140), hit = i === 4;
      s += `<line x1="22" y1="${y}" x2="${22 + w}" y2="${y}" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      s += `<circle cx="262" cy="${y}" r="4.5"${hit ? ' class="a"' : ''} fill="${hit ? 'currentColor' : 'none'}" stroke="currentColor" stroke-opacity="${hit ? 1 : 0.5}" stroke-width="2"/>`;
    }
  }
  if (kind === 'blocks') {
    for (let i = 0; i < 6; i++) s += `<rect x="${34 + i * 14}" y="${22 + i * 24}" width="160" height="16" rx="8"${i === 5 ? ' class="a"' : ''} fill="currentColor" opacity="${i === 5 ? 1 : (0.12 + i * 0.09).toFixed(2)}"/>`;
  }
  if (kind === 'rings') {
    for (let i = 1; i < 6; i++) s += `<path d="M ${150 - i * 24} 152 A ${i * 24} ${i * 24} 0 0 1 ${150 + i * 24} 152" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="${(0.75 - i * 0.11).toFixed(2)}"/>`;
    s += '<circle cx="150" cy="152" r="7" class="a" fill="currentColor"/>';
  }
  if (kind === 'grid') {
    for (let x = 0; x < 12; x++) for (let y = 0; y < 7; y++) {
      const hit = x > 6 && x < 10 && y > 1 && y < 5;
      s += `<circle cx="${23 + x * 23}" cy="${22 + y * 23}" r="${hit ? 6 : 3}"${hit ? ' class="a"' : ''} fill="currentColor" opacity="${hit ? 1 : 0.35}"/>`;
    }
  }
  if (kind === 'wave') {
    let d = 'M 12 124';
    for (let x = 12; x <= 288; x += 8) d += ` L ${x} ${(124 - Math.sin(x / 34) * 26 - x / 12).toFixed(1)}`;
    s += `<path d="${d}" fill="none" stroke="currentColor" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><circle cx="232" cy="42" r="20" class="a" fill="currentColor"/>`;
  }
  return `<svg class="motif" viewBox="0 0 300 180" role="presentation" aria-hidden="true">${s}</svg>`;
}
