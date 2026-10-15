import { normalizeHtml } from './html-normalize';

describe('normalizeHtml', () => {
  it('returns an empty string for empty input, whitespace and paragraphs without content', () => {
    for (const html of [null, undefined, '', '   ', '<p></p>', '<p><br></p>', '<p>&nbsp;</p>', '<p></p><p> </p>']) {
      expect(normalizeHtml(html)).withContext(String(html)).toBe('');
    }
  });

  it('keeps ordinary content untouched', () => {
    expect(normalizeHtml('<p>Hello <strong>world</strong></p>')).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('unwraps the lone paragraph of a list item and keeps nested lists', () => {
    expect(normalizeHtml('<ul><li><p>top</p><ul><li><p>child</p></li></ul></li></ul>'))
      .toBe('<ul><li>top<ul><li>child</li></ul></li></ul>');
  });

  it('keeps several paragraphs in a list item or cell', () => {
    expect(normalizeHtml('<ul><li><p>a</p><p>b</p></li></ul>')).toBe('<ul><li><p>a</p><p>b</p></li></ul>');
    expect(normalizeHtml('<table><tbody><tr><td><p>a</p><p>b</p></td></tr></tbody></table>'))
      .toBe('<table><tbody><tr><td><p>a</p><p>b</p></td></tr></tbody></table>');
  });

  it('keeps a paragraph that carries attributes, and a paragraph next to other blocks', () => {
    expect(normalizeHtml('<ul><li><p class="x">a</p></li></ul>')).toBe('<ul><li><p class="x">a</p></li></ul>');
    expect(normalizeHtml('<ul><li><p>a</p><blockquote><p>q</p></blockquote></li></ul>'))
      .toBe('<ul><li><p>a</p><blockquote><p>q</p></blockquote></li></ul>');
  });

  it('unwraps the lone paragraph of table cells', () => {
    expect(normalizeHtml('<table><tbody><tr><td><p>a</p></td><th><p>b</p></th></tr></tbody></table>'))
      .toBe('<table><tbody><tr><td>a</td><th>b</th></tr></tbody></table>');
  });

  it('moves a leading all-header row into thead', () => {
    expect(normalizeHtml('<table><tbody><tr><th><p>H</p></th></tr><tr><td><p>c</p></td></tr></tbody></table>'))
      .toBe('<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table>');
  });

  it('does not create a thead for a mixed first row or when one already exists', () => {
    const mixed = '<table><tbody><tr><th>H</th><td>c</td></tr></tbody></table>';
    expect(normalizeHtml(mixed)).toBe(mixed);
    const withHead = '<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table>';
    expect(normalizeHtml(withHead)).toBe(withHead);
  });

  it('drops trailing empty paragraphs only', () => {
    expect(normalizeHtml('<p>a</p><p></p><p>b</p><p></p><p><br></p>')).toBe('<p>a</p><p></p><p>b</p>');
  });

  it('treats a table as content even when every cell is empty', () => {
    const out = normalizeHtml('<table><tbody><tr><td><p></p></td></tr></tbody></table><p></p>');
    expect(out).toContain('<table');
    expect(out.endsWith('</table>')).toBeTrue();
  });

  it('treats an image or a rule as content', () => {
    expect(normalizeHtml('<p><img src="a.png"></p>')).toContain('<img');
    expect(normalizeHtml('<hr>')).toContain('<hr>');
  });

  it('is idempotent', () => {
    const inputs = [
      '<ul><li><p>top</p><ul><li><p>child</p></li></ul></li></ul>',
      '<table><tbody><tr><th><p>H</p></th></tr><tr><td><p>c</p></td></tr></tbody></table><p></p>',
      '<p>a</p><p></p><p>b</p><p></p>'
    ];
    for (const html of inputs) {
      const once = normalizeHtml(html);
      expect(normalizeHtml(once)).toBe(once);
    }
  });

  it('parses inertly: nothing in the input can run', () => {
    delete (window as any).__xss;
    normalizeHtml('<img src="x" onerror="window.__xss=1"><script>window.__xss=1</script>');
    expect((window as any).__xss).toBeUndefined();
  });
});
