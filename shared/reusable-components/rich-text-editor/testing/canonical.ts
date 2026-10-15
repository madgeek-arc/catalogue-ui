/**
 * Reduces HTML to a canonical outline so that CKEditor output and the new editor's output can be compared by meaning
 * rather than by bytes. Differences that are accepted by design are normalised away:
 *  - mark nesting order (<i><strong> vs <strong><i>) and <b>/<strong>, <em>/<i>
 *  - <figure>/<figcaption> wrappers (the new editor keeps an image inline in a paragraph and the caption as a paragraph)
 *  - <thead>/<tbody>/<tfoot> grouping (the cell types <th>/<td> are kept)
 *  - classes and inline styles
 *  - NBSP vs space, and empty paragraphs
 *  - media embeds (<figure class="media"><oembed>), which the app never rendered
 */
const MARK_TAGS: Record<string, string> = { STRONG: 'b', B: 'b', EM: 'i', I: 'i', U: 'u', S: 's', CODE: 'code' };
const TRANSPARENT = new Set(['THEAD', 'TBODY', 'TFOOT', 'FIGURE']);
const TEXT_BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'FIGCAPTION']);
const BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'TABLE', 'TR', 'TD', 'TH', 'FIGCAPTION', 'HR']);

function isBlock(node: Node): boolean {
  return node.nodeType === Node.ELEMENT_NODE && (BLOCKS.has((node as Element).tagName) || TRANSPARENT.has((node as Element).tagName));
}

interface Run { marks: string[]; text: string; }

function collectRuns(node: Node, marks: string[], runs: Run[]): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/ /g, ' ');
    if (text) {
      runs.push({ marks: [...marks].sort(), text });
    }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const el = node as Element;
  if (el.tagName === 'BR') {
    runs.push({ marks: [], text: '\n' });
  } else if (el.tagName === 'IMG') {
    runs.push({ marks: [], text: `[img ${el.getAttribute('src')} "${el.getAttribute('alt') ?? ''}"]` });
  } else {
    const mark = MARK_TAGS[el.tagName] ?? (el.tagName === 'A' ? `a=${el.getAttribute('href')}` : null);
    const next = mark && !marks.includes(mark) ? [...marks, mark] : marks;
    el.childNodes.forEach(child => collectRuns(child, next, runs));
  }
}

/** Inline content as text with each run's marks, adjacent runs with equal marks merged. */
function inlineOutline(nodes: Node[]): string {
  const runs: Run[] = [];
  nodes.forEach(n => collectRuns(n, [], runs));
  const merged: Run[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.marks.join() === run.marks.join()) {
      last.text += run.text;
    } else {
      merged.push({ marks: run.marks, text: run.text });
    }
  }
  return merged.map(r => (r.marks.length ? `{${r.marks.join(',')}:${r.text}}` : r.text)).join('').trim();
}

function cellAttributes(el: Element): string {
  if (el.tagName !== 'TD' && el.tagName !== 'TH') {
    return '';
  }
  return ['colspan', 'rowspan']
    .map(name => { const v = el.getAttribute(name); return v && v !== '1' ? ` ${name}=${v}` : ''; })
    .join('');
}

/** The outline of a node's children: runs of inline content become paragraphs, block children recurse. */
function childrenOutline(parent: Element): string {
  const parts: string[] = [];
  let inline: Node[] = [];
  const flush = () => {
    const text = inlineOutline(inline);
    if (text) {
      parts.push(`<p>${text}</p>`);
    }
    inline = [];
  };
  parent.childNodes.forEach(child => {
    if (!isBlock(child)) {
      inline.push(child);
      return;
    }
    flush();
    const el = child as Element;
    parts.push(TRANSPARENT.has(el.tagName) ? childrenOutline(el) : blockOutline(el));
  });
  flush();
  return parts.join('');
}

function blockOutline(el: Element): string {
  if (el.tagName === 'HR') {
    return '<hr>';
  }
  const tag = el.tagName === 'FIGCAPTION' ? 'p' : el.tagName.toLowerCase();
  const children = Array.from(el.childNodes);
  // a text block with only inline content is its own paragraph; otherwise (e.g. li > ul) recurse
  const inner = TEXT_BLOCKS.has(el.tagName) && !children.some(isBlock) ? inlineOutline(children) : childrenOutline(el);
  return `<${tag}${cellAttributes(el)}>${inner}</${tag}>`;
}

/** A lone paragraph in a list item or table cell is just its text (nested lists may follow it). */
function unwrapLoneParagraphs(root: Element): void {
  root.querySelectorAll('li, td, th').forEach(cell => {
    const paragraphs = Array.from(cell.children).filter(c => c.tagName === 'P');
    const others = Array.from(cell.children).filter(c => c.tagName !== 'P');
    if (paragraphs.length === 1 && others.every(c => c.tagName === 'UL' || c.tagName === 'OL')) {
      const p = paragraphs[0];
      while (p.firstChild) {
        cell.insertBefore(p.firstChild, p);
      }
      p.remove();
    }
  });
}

export function canonicalize(html: string): string {
  const body = new DOMParser().parseFromString(html ?? '', 'text/html').body;
  body.querySelectorAll('figure.media').forEach(el => el.remove());
  unwrapLoneParagraphs(body);
  // a paragraph without text or image carries no meaning
  body.querySelectorAll('p').forEach(p => {
    if (!p.querySelector('img') && (p.textContent ?? '').replace(/[\s ]+/g, '') === '') {
      p.remove();
    }
  });
  return childrenOutline(body);
}
