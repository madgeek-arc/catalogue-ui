import { Editor } from '@tiptap/core';
import { createExtensions, isAllowedHref, isAllowedImageSrc } from './editor-extensions';
import { normalizeHtml } from './html-normalize';
import { HOSTILE_INPUTS } from './testing/ckeditor-fixtures';

function roundTrip(html: string): string {
  const editor = new Editor({ extensions: createExtensions(), content: html });
  const out = normalizeHtml(editor.getHTML());
  editor.destroy();
  return out;
}

describe('hostile content', () => {
  beforeEach(() => delete (window as any).__xss);

  for (const hostile of HOSTILE_INPUTS) {
    it(`is neutralised: ${hostile.slice(0, 70)}`, () => {
      const out = roundTrip(hostile);
      expect(out).withContext(out).not.toMatch(/<(script|iframe|svg|style|object|embed|form|input|math)\b/i);
      expect(out).withContext(out).not.toMatch(/\son\w+\s*=/i);
      expect(out).withContext(out).not.toMatch(/javascript:|vbscript:|data:text\/html/i);
      expect(out).withContext(out).not.toMatch(/\sstyle\s*=/i);
      expect((window as any).__xss).toBeUndefined();
    });
  }

  it('keeps the visible text of a link whose target was rejected', () => {
    expect(roundTrip('<p><a href="javascript:alert(1)">click me</a></p>')).toBe('<p>click me</p>');
  });
});

describe('isAllowedHref', () => {
  const allowed = ['https://example.org', 'http://example.org/a?b=1#c', 'mailto:a@example.org', 'tel:+3012345', '/relative', 'page.html', '#anchor', '?q=1', '//cdn.example.org/x'];
  const rejected = ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'java\tscript:alert(1)', 'java\nscript:alert(1)', 'data:text/html;base64,AAAA',
    'vbscript:msgbox(1)', 'file:///etc/passwd', 'ftp://example.org', '', '   ', null, undefined];

  for (const href of allowed) {
    it(`allows ${JSON.stringify(href)}`, () => expect(isAllowedHref(href)).toBeTrue());
  }
  for (const href of rejected) {
    it(`rejects ${JSON.stringify(href)}`, () => expect(isAllowedHref(href)).toBeFalse());
  }
});

describe('isAllowedImageSrc', () => {
  it('allows http(s), relative URLs and base64 raster images', () => {
    for (const src of ['https://example.org/a.png', 'http://example.org/a.png', '/assets/a.png', 'a.png', 'data:image/png;base64,AAAA', 'data:image/jpeg;base64,AAAA']) {
      expect(isAllowedImageSrc(src)).withContext(src).toBeTrue();
    }
  });

  it('rejects scripts, html, svg data and empty sources', () => {
    for (const src of ['javascript:alert(1)', 'data:text/html;base64,AAAA', 'data:image/svg+xml;base64,AAAA', 'vbscript:x', '', null, undefined]) {
      expect(isAllowedImageSrc(src)).withContext(String(src)).toBeFalse();
    }
  });
});
