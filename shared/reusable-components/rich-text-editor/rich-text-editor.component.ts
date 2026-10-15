import {
  AfterViewInit, booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, ElementRef,
  forwardRef, inject, input, NgZone, OnDestroy, signal, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import { createExtensions, isAllowedHref } from './editor-extensions';
import { normalizeHtml } from './html-normalize';

interface ToolbarState {
  bold: boolean;
  italic: boolean;
  link: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  /** 0 = paragraph, otherwise the heading level (1-6). */
  heading: number;
  canIndent: boolean;
  canOutdent: boolean;
  canUndo: boolean;
  canRedo: boolean;
  inTable: boolean;
  /** The document is a single empty paragraph (placeholder is shown). */
  empty: boolean;
}

const INITIAL_STATE: ToolbarState = {
  bold: false, italic: false, link: false, bulletList: false, orderedList: false, blockquote: false, heading: 0,
  canIndent: false, canOutdent: false, canUndo: false, canRedo: false, inTable: false, empty: true
};

/**
 * Rich text editor (TipTap/ProseMirror) usable with ngModel, formControl and formControlName. The value is an HTML
 * string; an empty editor is ''. It replaces the CKEditor 5 classic build with the same toolbar and HTML shape.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true }],
  host: {
    'class': 'rte',
    '[class.rte--readonly]': '!editable()',
    '[style.--rte-min-height]': 'minHeight() + "px"',
    '(focusout)': 'onFocusOut($event)'
  }
})
export class RichTextEditorComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  placeholder = input<string | null | undefined>('');
  /** Minimum height of the editing area in px. */
  minHeight = input<number>(150);
  readOnly = input(false, { alias: 'readonly', transform: booleanAttribute });
  ariaLabel = input<string>('Rich text editor');

  @ViewChild('content', { static: true }) contentHost: ElementRef<HTMLElement>;
  @ViewChild('linkInput') linkInput: ElementRef<HTMLInputElement> | undefined;

  readonly headingOptions = [
    { level: 0, label: 'Paragraph' },
    { level: 2, label: 'Heading 1' },
    { level: 3, label: 'Heading 2' },
    { level: 4, label: 'Heading 3' }
  ];

  state: ToolbarState = INITIAL_STATE;
  linkBarOpen = false;
  linkUrl = '';
  linkError = '';

  private disabled = signal(false);
  editable = computed(() => !this.disabled() && !this.readOnly());

  private editor: Editor | null = null;
  /** The value the form model is known to hold, i.e. the last value written to or emitted by this editor. */
  private current = '';
  private destroyed = false;

  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private host: ElementRef<HTMLElement> = inject(ElementRef);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const editable = this.editable();
      // emitUpdate=false: toggling editability must not look like a user edit
      this.editor?.setEditable(editable, false);
    });
  }

  /** The underlying TipTap editor (for tests and advanced use). */
  get tiptap(): Editor | null {
    return this.editor;
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.editor = new Editor({
        element: this.contentHost.nativeElement,
        extensions: createExtensions(),
        content: this.current,
        editable: this.editable(),
        editorProps: {
          attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': this.ariaLabel() },
          handleKeyDown: (_view, event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
              event.preventDefault();
              this.ngZone.run(() => this.openLinkBar());
              return true;
            }
            return false;
          }
        },
        onUpdate: () => this.handleUpdate(),
        onTransaction: () => this.refreshState()
      });
    });
    this.refreshState();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.editor?.destroy();
    this.editor = null;
  }

  focus(): void {
    this.editor?.commands.focus('end');
  }

  // --- ControlValueAccessor ---

  writeValue(value: string | null | undefined): void {
    const html = value ?? '';
    // Idempotent on purpose: Angular calls writeValue again with the same value when controls are re-bound
    // (FormArray reorder, sortable); resetting the content then would lose the selection and the undo history.
    if (html === this.current) {
      return;
    }
    this.current = html;
    if (this.editor) {
      this.editor.chain().setMeta('addToHistory', false).setContent(html, { emitUpdate: false }).run();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onFocusOut(event: FocusEvent): void {
    if (!this.host.nativeElement.contains(event.relatedTarget as Node | null)) {
      this.onTouched();
    }
  }

  // --- toolbar commands (all keep the selection in the editor) ---

  onToolbarMouseDown(event: MouseEvent): void {
    // keep focus and selection in the editor when clicking a button; inputs and selects need the focus
    if (!(event.target as HTMLElement).closest('input, select')) {
      event.preventDefault();
    }
  }

  toggleBold() { this.editor?.chain().focus().toggleBold().run(); }
  toggleItalic() { this.editor?.chain().focus().toggleItalic().run(); }
  toggleBulletList() { this.editor?.chain().focus().toggleBulletList().run(); }
  toggleOrderedList() { this.editor?.chain().focus().toggleOrderedList().run(); }
  toggleBlockquote() { this.editor?.chain().focus().toggleBlockquote().run(); }
  indent() { this.editor?.chain().focus().sinkListItem('listItem').run(); }
  outdent() { this.editor?.chain().focus().liftListItem('listItem').run(); }
  undo() { this.editor?.chain().focus().undo().run(); }
  redo() { this.editor?.chain().focus().redo().run(); }

  setHeading(level: number | string) {
    const n = Number(level);
    const chain = this.editor?.chain().focus();
    if (n) {
      chain?.setHeading({ level: n as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    } else {
      chain?.setParagraph().run();
    }
  }

  insertTable() { this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }
  addRow() { this.editor?.chain().focus().addRowAfter().run(); }
  deleteRow() { this.editor?.chain().focus().deleteRow().run(); }
  addColumn() { this.editor?.chain().focus().addColumnAfter().run(); }
  deleteColumn() { this.editor?.chain().focus().deleteColumn().run(); }
  mergeOrSplitCells() { this.editor?.chain().focus().mergeOrSplit().run(); }
  deleteTable() { this.editor?.chain().focus().deleteTable().run(); }

  // --- links ---

  openLinkBar(): void {
    if (!this.editor || !this.editable()) {
      return;
    }
    this.linkUrl = this.editor.getAttributes('link')['href'] ?? '';
    this.linkError = '';
    this.linkBarOpen = true;
    this.cdr.markForCheck();
    setTimeout(() => this.linkInput?.nativeElement.focus());
  }

  closeLinkBar(): void {
    this.linkBarOpen = false;
    this.linkError = '';
    this.editor?.commands.focus();
  }

  applyLink(): void {
    const raw = this.linkUrl.trim();
    if (!raw) {
      this.removeLink();
      return;
    }
    // "example.org" -> "https://example.org"; relative ("/x", "#x", "?q") and scheme-qualified URLs are kept
    const href = /^([a-z][a-z0-9+.-]*:|[/#?])/i.test(raw) ? raw : 'https://' + raw;
    if (!isAllowedHref(href)) {
      this.linkError = 'Only http, https, mailto and tel links are allowed.';
      return;
    }
    const editor = this.editor;
    if (!editor) {
      return;
    }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    this.linkBarOpen = false;
    this.linkError = '';
  }

  removeLink(): void {
    this.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    this.linkBarOpen = false;
    this.linkError = '';
  }

  // --- internals ---

  private handleUpdate(): void {
    if (!this.editor) {
      return;
    }
    const html = normalizeHtml(this.editor.getHTML());
    if (html === this.current) {
      return;
    }
    this.current = html;
    this.ngZone.run(() => this.onChange(html));
  }

  /** Recomputes the toolbar state after every transaction; re-renders only when something actually changed. */
  private refreshState(): void {
    const editor = this.editor;
    if (!editor || this.destroyed) {
      return;
    }
    const doc = editor.state.doc;
    const can = editor.can();
    const next: ToolbarState = {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      link: editor.isActive('link'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      heading: [1, 2, 3, 4, 5, 6].find(level => editor.isActive('heading', { level })) ?? 0,
      canIndent: can.sinkListItem('listItem'),
      canOutdent: can.liftListItem('listItem'),
      canUndo: can.undo(),
      canRedo: can.redo(),
      inTable: editor.isActive('table'),
      empty: doc.childCount === 1 && doc.firstChild?.type.name === 'paragraph' && doc.firstChild.content.size === 0
    };
    const changed = (Object.keys(next) as (keyof ToolbarState)[]).some(key => next[key] !== this.state[key]);
    if (changed) {
      this.state = next;
      this.cdr.detectChanges();
    }
  }
}
