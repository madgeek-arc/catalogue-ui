import { canonicalize } from './canonical';

/** The legacy-content tests are only as trustworthy as this helper: it must ignore accepted differences and catch real ones. */
describe('canonicalize (test helper)', () => {
  describe('ignores accepted differences', () => {
    const same: [string, string, string][] = [
      ['mark nesting order', '<p><strong><i>x</i></strong></p>', '<p><i><strong>x</strong></i></p>'],
      ['<b>/<strong> and <em>/<i>', '<p><b>x</b> <em>y</em></p>', '<p><strong>x</strong> <i>y</i></p>'],
      ['classes and styles', '<p class="a" style="color:red">x</p>', '<p>x</p>'],
      ['nbsp vs space', '<p>a&nbsp;b</p>', '<p>a b</p>'],
      ['empty paragraphs', '<p>a</p><p></p><p>&nbsp;</p>', '<p>a</p>'],
      ['table figure wrapper and thead', '<figure class="table"><table><thead><tr><th>h</th></tr></thead><tbody><tr><td>c</td></tr></tbody></table></figure>', '<table><tbody><tr><th>h</th></tr><tr><td>c</td></tr></tbody></table>'],
      ['image figure/caption vs inline image + paragraph', '<figure class="image"><img src="a.png" alt="x"><figcaption>Cap</figcaption></figure>', '<p><img src="a.png" alt="x"></p><p>Cap</p>'],
      ['list item text with or without a paragraph', '<ul><li>a<ul><li>b</li></ul></li></ul>', '<ul><li><p>a</p><ul><li><p>b</p></li></ul></li></ul>'],
      ['media embeds', '<p>a</p><figure class="media"><oembed url="https://x"></oembed></figure>', '<p>a</p>']
    ];
    for (const [name, a, b] of same) {
      it(name, () => expect(canonicalize(a)).withContext(`${canonicalize(a)}  vs  ${canonicalize(b)}`).toBe(canonicalize(b)));
    }
  });

  describe('catches real differences', () => {
    const different: [string, string, string][] = [
      ['text', '<p>a</p>', '<p>b</p>'],
      ['bold vs plain', '<p><strong>a</strong></p>', '<p>a</p>'],
      ['italic vs bold', '<p><i>a</i></p>', '<p><b>a</b></p>'],
      ['underline vs plain', '<p><u>a</u></p>', '<p>a</p>'],
      ['bullet vs numbered list', '<ul><li>a</li></ul>', '<ol><li>a</li></ol>'],
      ['heading level', '<h2>a</h2>', '<h3>a</h3>'],
      ['heading vs paragraph', '<h2>a</h2>', '<p>a</p>'],
      ['link target', '<p><a href="https://a.org">x</a></p>', '<p><a href="https://b.org">x</a></p>'],
      ['link vs plain text', '<p><a href="https://a.org">x</a></p>', '<p>x</p>'],
      ['list nesting', '<ul><li>a<ul><li>b</li></ul></li></ul>', '<ul><li>a</li><li>b</li></ul>'],
      ['paragraph split', '<p>a b</p>', '<p>a</p><p>b</p>'],
      ['line break', '<p>a<br>b</p>', '<p>a b</p>'],
      ['colspan', '<table><tbody><tr><td colspan="2">a</td></tr></tbody></table>', '<table><tbody><tr><td>a</td></tr></tbody></table>'],
      ['header vs data cell', '<table><tbody><tr><th>a</th></tr></tbody></table>', '<table><tbody><tr><td>a</td></tr></tbody></table>'],
      ['blockquote', '<blockquote><p>a</p></blockquote>', '<p>a</p>'],
      ['image source', '<p><img src="a.png"></p>', '<p><img src="b.png"></p>'],
      ['missing image', '<p><img src="a.png"></p>', '<p></p>'],
      ['block order', '<p>a</p><h2>b</h2>', '<h2>b</h2><p>a</p>']
    ];
    for (const [name, a, b] of different) {
      it(name, () => expect(canonicalize(a)).not.toBe(canonicalize(b)));
    }
  });
});
