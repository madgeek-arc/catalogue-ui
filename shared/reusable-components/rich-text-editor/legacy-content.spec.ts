import { Editor } from '@tiptap/core';
import { createExtensions } from './editor-extensions';
import { normalizeHtml } from './html-normalize';
import { CKEDITOR_FIXTURES } from './testing/ckeditor-fixtures';
import { canonicalize } from './testing/canonical';

/** What the editor would write back for content loaded from the database. */
function roundTrip(html: string): string {
  const editor = new Editor({ extensions: createExtensions(), content: html });
  const out = normalizeHtml(editor.getHTML());
  editor.destroy();
  return out;
}

/** Fixtures whose bytes should survive unchanged: the new editor writes the exact markup CKEditor did. */
const EXACT = [
  'paragraph', 'two-paragraphs', 'line-break', 'nbsp-inline', 'headings', 'link', 'link-formatted', 'link-mailto-relative',
  'bullet-list', 'ordered-list', 'nested-lists', 'mixed-nested-lists', 'list-item-formatted', 'blockquote',
  'table-simple', 'table-header', 'table-merged-cells', 'table-formatted-cells', 'mixed-document', 'empty'
];

describe('content stored by CKEditor 5 (real output of the classic build 37.1.0)', () => {
  for (const fixture of CKEDITOR_FIXTURES) {
    it(`keeps the meaning of "${fixture.name}"`, () => {
      expect(canonicalize(roundTrip(fixture.ckeditor))).toBe(canonicalize(fixture.ckeditor));
    });

    it(`is stable on a second pass for "${fixture.name}"`, () => {
      const once = roundTrip(fixture.ckeditor);
      expect(roundTrip(once)).toBe(once);
    });
  }

  for (const name of EXACT) {
    it(`writes "${name}" back byte for byte`, () => {
      const fixture = CKEDITOR_FIXTURES.find(f => f.name === name)!;
      expect(roundTrip(fixture.ckeditor)).toBe(fixture.ckeditor);
    });
  }

  it('reads empty CKEditor values as empty', () => {
    expect(roundTrip('')).toBe('');
    expect(roundTrip('<p>&nbsp;</p>')).toBe('');
  });

  it('keeps the legacy heading levels (CKEditor "Heading 1/2/3" are h2/h3/h4)', () => {
    expect(roundTrip('<h1>a</h1><h2>b</h2><h5>c</h5><h6>d</h6>')).toBe('<h1>a</h1><h2>b</h2><h5>c</h5><h6>d</h6>');
  });

  it('keeps both images that CKEditor could write, as inline images', () => {
    const block = roundTrip('<figure class="image"><img src="https://example.org/a.png" alt="alt text"></figure>');
    expect(block).toContain('<img src="https://example.org/a.png" alt="alt text">');
    const inline = roundTrip('<p>before <img src="https://example.org/i.png"> after</p>');
    expect(inline).toContain('before <img src="https://example.org/i.png"> after');
  });

  it('accepts what CKEditor never offered but a database could hold (underline, strike, code)', () => {
    const out = roundTrip('<p><u>u</u> <s>s</s> <code>c</code></p>');
    expect(out).toContain('<u>u</u>');
    expect(out).toContain('<s>s</s>');
    expect(out).toContain('<code>c</code>');
  });
});
