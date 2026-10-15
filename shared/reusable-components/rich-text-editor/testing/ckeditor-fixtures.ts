/**
 * Real CKEditor 5 output, used to check that the new editor reads (and re-writes) what the old one stored.
 *
 * A one-time snapshot, do not edit the `ckeditor` values by hand: each is what `editor.getData()` returned for `input`
 * in the CKEditor 5 classic build 37.1.0 (the version this app shipped with), driven in headless Chrome. CKEditor is no
 * longer a dependency; to add cases, install @ckeditor/ckeditor5-build-classic@37.1.0 temporarily, load its
 * build/ckeditor.js in a page, call `ClassicEditor.create(...)`, `setData(input)` and copy the result of `getData()`.
 */
export interface CkeditorFixture {
  name: string;
  /** HTML fed to CKEditor. */
  input: string;
  /** HTML CKEditor serialised, i.e. what is stored in the database. */
  ckeditor: string;
}

export const CKEDITOR_FIXTURES: CkeditorFixture[] = [
  {
    name: "paragraph",
    input: "<p>Plain paragraph of text.</p>",
    ckeditor: "<p>Plain paragraph of text.</p>"
  },
  {
    name: "two-paragraphs",
    input: "<p>First.</p><p>Second.</p>",
    ckeditor: "<p>First.</p><p>Second.</p>"
  },
  {
    name: "bold-italic",
    input: "<p><strong>bold</strong> then <i>italic</i> then <strong><i>both</i></strong></p>",
    ckeditor: "<p><strong>bold</strong> then <i>italic</i> then <i><strong>both</strong></i></p>"
  },
  {
    name: "line-break",
    input: "<p>line one<br>line two</p>",
    ckeditor: "<p>line one<br>line two</p>"
  },
  {
    name: "nbsp-inline",
    input: "<p>a&nbsp;b&nbsp;&nbsp;c</p>",
    ckeditor: "<p>a&nbsp;b&nbsp;&nbsp;c</p>"
  },
  {
    name: "empty-paragraph-nbsp",
    input: "<p>&nbsp;</p>",
    ckeditor: ""
  },
  {
    name: "special-chars",
    input: "<p>&amp; &lt;tag&gt; &quot;quoted&quot; &#39;apos&#39; café 中文 😀</p>",
    ckeditor: "<p>&amp; &lt;tag&gt; \"quoted\" 'apos' café 中文 😀</p>"
  },
  {
    name: "headings",
    input: "<h2>Heading 1</h2><h3>Heading 2</h3><h4>Heading 3</h4><p>after</p>",
    ckeditor: "<h2>Heading 1</h2><h3>Heading 2</h3><h4>Heading 3</h4><p>after</p>"
  },
  {
    name: "link",
    input: "<p>See <a href=\"https://example.org/path?a=1&amp;b=2\">the site</a> for details.</p>",
    ckeditor: "<p>See <a href=\"https://example.org/path?a=1&amp;b=2\">the site</a> for details.</p>"
  },
  {
    name: "link-formatted",
    input: "<p><a href=\"https://example.org\"><strong>bold link</strong></a></p>",
    ckeditor: "<p><a href=\"https://example.org\"><strong>bold link</strong></a></p>"
  },
  {
    name: "link-mailto-relative",
    input: "<p><a href=\"mailto:someone@example.org\">mail</a> and <a href=\"/relative/page\">rel</a></p>",
    ckeditor: "<p><a href=\"mailto:someone@example.org\">mail</a> and <a href=\"/relative/page\">rel</a></p>"
  },
  {
    name: "bullet-list",
    input: "<ul><li>one</li><li>two</li><li>three</li></ul>",
    ckeditor: "<ul><li>one</li><li>two</li><li>three</li></ul>"
  },
  {
    name: "ordered-list",
    input: "<ol><li>one</li><li>two</li></ol>",
    ckeditor: "<ol><li>one</li><li>two</li></ol>"
  },
  {
    name: "nested-lists",
    input: "<ul><li>top<ul><li>child<ul><li>grandchild</li></ul></li></ul></li><li>top two</li></ul>",
    ckeditor: "<ul><li>top<ul><li>child<ul><li>grandchild</li></ul></li></ul></li><li>top two</li></ul>"
  },
  {
    name: "mixed-nested-lists",
    input: "<ol><li>step<ul><li>detail a</li><li>detail b</li></ul></li><li>step two</li></ol>",
    ckeditor: "<ol><li>step<ul><li>detail a</li><li>detail b</li></ul></li><li>step two</li></ol>"
  },
  {
    name: "list-item-formatted",
    input: "<ul><li><strong>Bold</strong> start, <a href=\"https://example.org\">link</a> end</li></ul>",
    ckeditor: "<ul><li><strong>Bold</strong> start, <a href=\"https://example.org\">link</a> end</li></ul>"
  },
  {
    name: "blockquote",
    input: "<blockquote><p>Quoted <strong>text</strong>.</p><p>Second quoted paragraph.</p></blockquote>",
    ckeditor: "<blockquote><p>Quoted <strong>text</strong>.</p><p>Second quoted paragraph.</p></blockquote>"
  },
  {
    name: "table-simple",
    input: "<figure class=\"table\"><table><tbody><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></tbody></table></figure>",
    ckeditor: "<figure class=\"table\"><table><tbody><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></tbody></table></figure>"
  },
  {
    name: "table-header",
    input: "<figure class=\"table\"><table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure>",
    ckeditor: "<figure class=\"table\"><table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure>"
  },
  {
    name: "table-merged-cells",
    input: "<figure class=\"table\"><table><tbody><tr><td colspan=\"2\">wide</td></tr><tr><td rowspan=\"2\">tall</td><td>x</td></tr><tr><td>y</td></tr></tbody></table></figure>",
    ckeditor: "<figure class=\"table\"><table><tbody><tr><td colspan=\"2\">wide</td></tr><tr><td rowspan=\"2\">tall</td><td>x</td></tr><tr><td>y</td></tr></tbody></table></figure>"
  },
  {
    name: "table-formatted-cells",
    input: "<figure class=\"table\"><table><tbody><tr><td><strong>b</strong> and <a href=\"https://example.org\">l</a></td><td>&nbsp;</td></tr></tbody></table></figure>",
    ckeditor: "<figure class=\"table\"><table><tbody><tr><td><strong>b</strong> and <a href=\"https://example.org\">l</a></td><td>&nbsp;</td></tr></tbody></table></figure>"
  },
  {
    name: "image-block-caption",
    input: "<figure class=\"image\"><img src=\"https://example.org/a.png\" alt=\"alt text\"><figcaption>Caption</figcaption></figure>",
    ckeditor: "<figure class=\"image\"><img src=\"https://example.org/a.png\" alt=\"alt text\"><figcaption>Caption</figcaption></figure>"
  },
  {
    name: "image-inline",
    input: "<p>before <img src=\"https://example.org/i.png\" alt=\"i\"> after</p>",
    ckeditor: "<p>before <img src=\"https://example.org/i.png\" alt=\"i\"> after</p>"
  },
  {
    name: "image-side",
    input: "<figure class=\"image image-style-side\"><img src=\"https://example.org/s.png\"></figure>",
    ckeditor: "<figure class=\"image image-style-side\"><img src=\"https://example.org/s.png\"></figure>"
  },
  {
    name: "media-embed",
    input: "<figure class=\"media\"><oembed url=\"https://www.youtube.com/watch?v=abc123\"></oembed></figure>",
    ckeditor: "<figure class=\"media\"><oembed url=\"https://www.youtube.com/watch?v=abc123\"></oembed></figure>"
  },
  {
    name: "word-paste-noise",
    input: "<p class=\"MsoNormal\" style=\"margin:0cm\"><span style=\"font-family:Calibri;font-size:11pt\"><b>Pasted</b> from <u>Word</u></span></p>",
    ckeditor: "<p><strong>Pasted</strong> from Word</p>"
  },
  {
    name: "unsupported-marks",
    input: "<p><u>underline</u> <s>strike</s> <code>code</code> <sup>sup</sup></p>",
    ckeditor: "<p>underline strike code sup</p>"
  },
  {
    name: "mixed-document",
    input: "<h2>Title</h2><p>Intro with <strong>bold</strong>.</p><ul><li>a</li><li>b</li></ul><figure class=\"table\"><table><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure><p>Outro.</p>",
    ckeditor: "<h2>Title</h2><p>Intro with <strong>bold</strong>.</p><ul><li>a</li><li>b</li></ul><figure class=\"table\"><table><tbody><tr><td>1</td><td>2</td></tr></tbody></table></figure><p>Outro.</p>"
  },
  {
    name: "empty",
    input: "",
    ckeditor: ""
  }
];

/** Input that must never survive a round trip through the editor in an executable form. */
export const HOSTILE_INPUTS: string[] = [
  '<script>window.__xss=1</script><p>a</p>',
  '<p><img src=x onerror="window.__xss=1"></p>',
  '<p><a href="javascript:window.__xss=1">x</a></p>',
  '<p><a href=" jav&#x09;ascript:window.__xss=1">x</a></p>',
  '<p><a href="JaVaScRiPt:window.__xss=1">x</a></p>',
  '<p><a href="&#106;avascript:window.__xss=1">x</a></p>',
  '<p><a href="data:text/html;base64,PHNjcmlwdD53aW5kb3cuX194c3M9MTwvc2NyaXB0Pg==">x</a></p>',
  '<p><a href="vbscript:msgbox(1)">x</a></p>',
  '<p><img src="javascript:window.__xss=1"></p>',
  '<p><img src="data:text/html;base64,PHNjcmlwdD4=" alt="x"></p>',
  '<iframe src="https://evil.example"></iframe><p>t</p>',
  '<svg onload="window.__xss=1"><circle/></svg><p>t</p>',
  '<style>body{display:none}</style><p>t</p>',
  '<div onclick="window.__xss=1">click</div>',
  '<p style="background:url(javascript:window.__xss=1)">s</p>',
  '<object data="x"></object><embed src="x"><p>t</p>',
  '<form action="https://evil.example"><input name="a"></form><p>t</p>',
  '<math><mi xlink:href="javascript:window.__xss=1">x</mi></math><p>t</p>',
  '<p>text<script>window.__xss=1</script></p>',
  '<table><tbody><tr><td onmouseover="window.__xss=1">c</td></tr></tbody></table>'
];
