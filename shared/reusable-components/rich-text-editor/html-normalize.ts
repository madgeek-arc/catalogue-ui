/**
 * Turns TipTap's HTML into the shape CKEditor 5 used to store, so existing renderers (plain [innerHTML] with UIkit
 * styles) keep looking the same and old and new content stay interchangeable:
 *  - a lone attribute-less <p> inside <li>/<td>/<th> is unwrapped (TipTap's schema forces it, CKEditor omitted it);
 *  - a leading all-<th> table row is moved into <thead> (TipTap only has <tbody>);
 *  - trailing empty paragraphs are dropped, and a document with no content at all becomes '' (so that
 *    Validators.required works).
 * Parsing uses an inert DOMParser document, so nothing in the input can execute.
 */
const CONTENT_ELEMENTS = 'img, table, hr, iframe, figure, video, audio';

function isBlank(el: Element): boolean {
  return !el.querySelector(CONTENT_ELEMENTS) && (el.textContent ?? '').replace(/[\s ]+/g, '') === '';
}

function unwrapLoneParagraph(container: Element): void {
  const paragraphs = Array.from(container.children).filter(c => c.tagName === 'P');
  if (paragraphs.length !== 1 || paragraphs[0].attributes.length > 0) {
    return;
  }
  const p = paragraphs[0];
  // Only unwrap when the paragraph is the container's text block; lists may follow it (nested lists in <li>).
  const others = Array.from(container.children).filter(c => c !== p);
  if (others.some(c => !/^(UL|OL)$/.test(c.tagName))) {
    return;
  }
  while (p.firstChild) {
    container.insertBefore(p.firstChild, p);
  }
  p.remove();
}

function moveHeaderRowToThead(table: Element): void {
  if (table.querySelector(':scope > thead')) {
    return;
  }
  const body = table.querySelector(':scope > tbody');
  const first = body?.querySelector(':scope > tr');
  if (!body || !first || first.children.length === 0 || !Array.from(first.children).every(c => c.tagName === 'TH')) {
    return;
  }
  const thead = table.ownerDocument.createElement('thead');
  thead.appendChild(first);
  table.insertBefore(thead, body);
}

export function normalizeHtml(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  const body = new DOMParser().parseFromString(html, 'text/html').body;

  body.querySelectorAll('li, td, th').forEach(unwrapLoneParagraph);
  body.querySelectorAll('table').forEach(moveHeaderRowToThead);

  // Drop trailing empty paragraphs (TipTap keeps one after a table so the cursor can leave it).
  let last = body.lastElementChild;
  while (last && last.tagName === 'P' && isBlank(last)) {
    last.remove();
    last = body.lastElementChild;
  }
  // Nothing but empty paragraphs (or whitespace) means "empty".
  const hasContent = Array.from(body.children).some(c => !(c.tagName === 'P' && isBlank(c)));
  if (!hasContent && !(body.textContent ?? '').replace(/[\s ]+/g, '')) {
    return '';
  }
  return body.innerHTML;
}
