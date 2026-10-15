import { Extensions, mergeAttributes } from '@tiptap/core';
import { Image } from '@tiptap/extension-image';
import { Italic } from '@tiptap/extension-italic';
import { Table, TableKit } from '@tiptap/extension-table';
import { StarterKit } from '@tiptap/starter-kit';

const ALLOWED_SCHEME = /^(https?|mailto|tel):/i;
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Whether a link target may be stored: http(s), mailto, tel and scheme-less (relative) URLs.
 * Everything else (javascript:, data:, vbscript:, ...) is rejected. Characters that browsers ignore
 * inside a scheme ("java\tscript:") are stripped before the check.
 */
export function isAllowedHref(href: string | null | undefined): boolean {
  const compact = (href ?? '').replace(/[\u0000- \u007f-\u009f]/g, '');
  if (!compact) {
    return false;
  }
  return ANY_SCHEME.test(compact) ? ALLOWED_SCHEME.test(compact) : true;
}

/**
 * Whether an image source may be stored: http(s), relative URLs and base64 raster images. TipTap's Image accepts any
 * `src`, so `javascript:` and similar must be rejected here.
 */
export function isAllowedImageSrc(src: string | null | undefined): boolean {
  const compact = (src ?? '').replace(/[\u0000- \u007f-\u009f]/g, '');
  if (!compact) {
    return false;
  }
  if (!ANY_SCHEME.test(compact)) {
    return true;
  }
  return /^https?:/i.test(compact) || /^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i.test(compact);
}

const SafeImage = Image.extend({
  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: element => (isAllowedImageSrc((element as HTMLElement).getAttribute('src')) ? null : false)
    }];
  }
});

/** CKEditor wrote italics as <i>; TipTap writes <em>, which UIkit colours with its danger colour. */
const ItalicAsI = Italic.extend({
  renderHTML({ HTMLAttributes }) {
    return ['i', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  }
});

/** CKEditor wrapped tables in <figure class="table">; keep that shape, without TipTap's colgroup and inline min-width. */
const TableAsFigure = Table.extend({
  renderHTML({ HTMLAttributes }) {
    return [
      'figure', { class: 'table' },
      ['table', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), ['tbody', 0]]
    ];
  }
});

/**
 * The schema is a superset of what CKEditor's classic build could produce (so old content is not silently
 * dropped), while the toolbar only offers what the classic build offered.
 */
export function createExtensions(): Extensions {
  return [
    StarterKit.configure({
      // CKEditor's "Heading 1/2/3" are <h2>/<h3>/<h4>; keep all levels so legacy <h1>, <h5>, <h6> still parse.
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      italic: false,
      // TipTap keeps an invisible empty paragraph after a heading or table, which Select all + "list" would turn
      // into an empty bullet; CKEditor never did that. The cursor can still leave a table with the arrow keys.
      trailingNode: false,
      link: {
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        defaultProtocol: 'https',
        // CKEditor's links had no target/rel.
        HTMLAttributes: { target: null, rel: null, class: null },
        isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && isAllowedHref(url)
      }
    }),
    ItalicAsI,
    TableKit.configure({ table: false }),
    TableAsFigure,
    SafeImage.configure({ inline: true })
  ];
}
