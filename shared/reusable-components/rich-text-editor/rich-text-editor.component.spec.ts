import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RichTextEditorComponent } from './rich-text-editor.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RichTextEditorComponent],
  template: `<app-rich-text-editor [formControl]="control" [placeholder]="placeholder" [readonly]="readonly">
  </app-rich-text-editor>`
})
class HostComponent {
  control = new FormControl<string | null>('');
  placeholder = 'Write something';
  readonly = false;
}

/** Same template pattern as the dynamic form's rich text field with multiplicity (FormArray, [formControlName]="i"). */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RichTextEditorComponent],
  template: `<form [formGroup]="form">
    <div [formArrayName]="'answers'">
      @for (control of answers.controls; track control; let i = $index) {
        <app-rich-text-editor [formControlName]="i" placeholder="Answer"></app-rich-text-editor>
      }
    </div>
  </form>`
})
class ArrayHostComponent {
  answers = new FormArray<FormControl<string | null>>([new FormControl('<p>one</p>'), new FormControl('<p>two</p>')]);
  form = new FormGroup({ answers: this.answers });
}

function setup(initial: string | null = '') {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.control.setValue(initial);
  fixture.detectChanges();
  const debugElement = fixture.debugElement.query(By.directive(RichTextEditorComponent));
  const rte = debugElement.componentInstance as RichTextEditorComponent;
  const el = debugElement.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, control: fixture.componentInstance.control, rte, el, editor: rte.tiptap! };
}

describe('RichTextEditorComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [HostComponent] }));

  it('creates the editor and shows the placeholder while empty', () => {
    const { rte, el } = setup();
    expect(rte.tiptap).toBeTruthy();
    expect(el.querySelector('.rte__placeholder')?.textContent).toContain('Write something');
  });

  it('renders the initial value of the form control', () => {
    const { editor, el } = setup('<p>Hello <strong>world</strong></p>');
    expect(editor.getText()).toBe('Hello world');
    expect(el.querySelector('.tiptap strong')).toBeTruthy();
    expect(el.querySelector('.rte__placeholder')).toBeNull();
  });

  it('does not emit or mark the control dirty when the value is written programmatically', () => {
    const { fixture, control, editor } = setup();
    control.setValue('<p>x</p>');
    fixture.detectChanges();
    expect(editor.getText()).toBe('x');
    expect(control.dirty).toBeFalse();
  });

  it('emits normalised HTML and marks the control dirty on user edits', () => {
    const { control, editor } = setup();
    editor.commands.insertContent('typed');
    expect(control.value).toBe('<p>typed</p>');
    expect(control.dirty).toBeTrue();
  });

  it('writes italics as <i>, like CKEditor did', () => {
    const { control, editor } = setup();
    editor.commands.insertContent('<p><em>x</em></p>');
    expect(control.value).toBe('<p><i>x</i></p>');
  });

  it('emits an empty string when the content is cleared', () => {
    const { control, editor } = setup('<p>text</p>');
    editor.commands.clearContent(true);
    expect(control.value).toBe('');
  });

  it('treats a table as content', () => {
    const { control, editor } = setup();
    editor.commands.insertTable({ rows: 2, cols: 2 });
    expect(control.value).toContain('<table');
  });

  it('works with Validators.required', () => {
    const { control, editor } = setup();
    control.addValidators(Validators.required);
    control.updateValueAndValidity();
    expect(control.valid).toBeFalse();
    editor.commands.insertContent('now filled');
    expect(control.valid).toBeTrue();
    editor.commands.clearContent(true);
    expect(control.valid).toBeFalse();
  });

  it('clears the editor when null is written, without marking the control dirty', () => {
    const { fixture, control, editor, el } = setup('<p>a</p>');
    control.setValue(null);
    fixture.detectChanges();
    expect(editor.getText()).toBe('');
    expect(control.dirty).toBeFalse();
    expect(el.querySelector('.rte__placeholder')).toBeTruthy();
  });

  it('ignores a write of the value it already holds (keeps the document, selection and history)', () => {
    const { control, editor } = setup();
    editor.commands.insertContent('abc');
    const before = editor.state.doc;
    control.setValue('<p>abc</p>');
    expect(editor.state.doc).toBe(before);
  });

  it('does not let undo cross a programmatic write', () => {
    const { control, editor } = setup();
    control.setValue('<p>A</p>');
    control.setValue('<p>B</p>');
    editor.commands.undo();
    expect(editor.getText()).toBe('B');
    editor.commands.insertContent('x');
    editor.commands.undo();
    expect(editor.getText()).toBe('B');
  });

  it('becomes read-only and hides the toolbar when the control is disabled', () => {
    const { fixture, control, editor, el } = setup('<p>a</p>');
    expect(el.querySelector('.rte__toolbar')).toBeTruthy();
    control.disable();
    fixture.detectChanges();
    expect(editor.isEditable).toBeFalse();
    expect(el.querySelector('.rte__toolbar')).toBeNull();
    control.enable();
    fixture.detectChanges();
    expect(editor.isEditable).toBeTrue();
    expect(el.querySelector('.rte__toolbar')).toBeTruthy();
  });

  it('does not emit when editability changes', () => {
    const { fixture, control } = setup('<p>a</p>');
    control.disable();
    fixture.detectChanges();
    control.enable();
    fixture.detectChanges();
    expect(control.dirty).toBeFalse();
  });

  it('supports the readonly input', () => {
    const { fixture, host, editor, el } = setup('<p>a</p>');
    host.readonly = true;
    fixture.detectChanges();
    expect(editor.isEditable).toBeFalse();
    expect(el.classList).toContain('rte--readonly');
    expect(el.querySelector('.rte__toolbar')).toBeNull();
  });

  it('follows changes of the placeholder text and hides it once there is content', () => {
    const { fixture, host, editor, el } = setup();
    host.placeholder = 'Other text';
    fixture.detectChanges();
    expect(el.querySelector('.rte__placeholder')?.textContent).toContain('Other text');
    editor.commands.insertContent('x');
    expect(el.querySelector('.rte__placeholder')).toBeNull();
  });

  it('marks the control as touched when focus leaves the editor, but not when it moves inside it', () => {
    const { control, el } = setup();
    el.dispatchEvent(new FocusEvent('focusout', { relatedTarget: el.querySelector('select'), bubbles: true }));
    expect(control.touched).toBeFalse();
    el.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null, bubbles: true }));
    expect(control.touched).toBeTrue();
  });

  it('applies bold from the toolbar', () => {
    const { control, editor, el } = setup('<p>hello</p>');
    editor.commands.selectAll();
    (el.querySelector('button[aria-label="Bold"]') as HTMLButtonElement).click();
    expect(control.value).toBe('<p><strong>hello</strong></p>');
  });

  it('turns the selection into a link, adding https:// when the scheme is missing', () => {
    const { fixture, control, rte, editor } = setup('<p>site</p>');
    editor.commands.selectAll();
    rte.openLinkBar();
    fixture.detectChanges();
    rte.linkUrl = 'example.org';
    rte.applyLink();
    expect(control.value).toBe('<p><a href="https://example.org">site</a></p>');
  });

  it('rejects javascript: links and reports why', () => {
    const { fixture, control, rte, editor, el } = setup('<p>site</p>');
    editor.commands.selectAll();
    rte.openLinkBar();
    rte.linkUrl = 'javascript:alert(1)';
    rte.applyLink();
    fixture.detectChanges();
    expect(control.value).toBe('<p>site</p>');
    expect(control.dirty).toBeFalse();
    expect(rte.linkError).toContain('Only http');
    expect(el.querySelector('.rte__error')).toBeTruthy();
  });

  it('does not keep phantom empty paragraphs after a heading or a table', () => {
    const { control, editor } = setup('<h2>Title</h2>');
    expect(editor.state.doc.childCount).toBe(1);
    control.setValue('<figure class="table"><table><tbody><tr><td>a</td></tr></tbody></table></figure>');
    expect(editor.state.doc.childCount).toBe(1);
  });

  it('wraps only real content when a list is applied to a selected-all document (no empty bullet)', () => {
    const { control, editor } = setup('<p>Title</p>');
    editor.commands.setHeading({ level: 2 });
    editor.commands.setParagraph();
    editor.commands.selectAll();
    editor.commands.toggleBulletList();
    expect(control.value).toBe('<ul><li>Title</li></ul>');
  });

  it('shows the table tools only while the cursor is in a table', () => {
    const { editor, el } = setup('<p>text</p>');
    expect(el.querySelector('.rte__toolbar--table')).toBeNull();
    editor.commands.insertTable({ rows: 2, cols: 2 });
    expect(el.querySelector('.rte__toolbar--table')).toBeTruthy();
  });

  it('destroys the editor with the component', () => {
    const { fixture, editor } = setup('<p>a</p>');
    fixture.destroy();
    expect(editor.isDestroyed).toBeTrue();
  });
});

describe('RichTextEditorComponent in a FormArray (repeatable rich text field)', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ArrayHostComponent] }));

  function arraySetup() {
    const fixture = TestBed.createComponent(ArrayHostComponent);
    fixture.detectChanges();
    const editors = () => fixture.debugElement.queryAll(By.directive(RichTextEditorComponent));
    const text = () => editors().map(e => (e.componentInstance as RichTextEditorComponent).tiptap!.getText());
    const nodes = () => editors().map(e => e.nativeElement as HTMLElement);
    return { fixture, host: fixture.componentInstance, answers: fixture.componentInstance.answers, editors, text, nodes };
  }

  it('renders one editor per entry with its own value', () => {
    const { text } = arraySetup();
    expect(text()).toEqual(['one', 'two']);
  });

  it('writes a user edit only to its own entry', () => {
    const { editors, answers } = arraySetup();
    (editors()[1].componentInstance as RichTextEditorComponent).tiptap!.commands.insertContent('!');
    expect(answers.at(0).value).toBe('<p>one</p>');
    expect(answers.at(1).value).toBe('<p>!two</p>');
    expect(answers.at(0).dirty).toBeFalse();
    expect(answers.at(1).dirty).toBeTrue();
  });

  it('adds an editor for a new entry without disturbing the others', () => {
    const { fixture, answers, text, nodes } = arraySetup();
    const before = nodes();
    answers.push(new FormControl(''));
    fixture.detectChanges();
    expect(text()).toEqual(['one', 'two', '']);
    expect(nodes().slice(0, 2)).toEqual(before);
    const added = fixture.debugElement.queryAll(By.directive(RichTextEditorComponent))[2].componentInstance as RichTextEditorComponent;
    added.tiptap!.commands.insertContent('three');
    expect(answers.at(2).value).toBe('<p>three</p>');
    expect(answers.at(0).value).toBe('<p>one</p>');
  });

  it('keeps the remaining editors, their DOM and their values when an entry is removed', () => {
    const { fixture, answers, text, nodes } = arraySetup();
    const secondNode = nodes()[1];
    answers.removeAt(0);
    fixture.detectChanges();
    expect(text()).toEqual(['two']);
    expect(nodes()[0]).toBe(secondNode);
    expect(answers.at(0).value).toBe('<p>two</p>');
  });

  it('follows a reorder of the entries (the sortable moves DOM nodes, the array is reordered)', () => {
    const { fixture, answers, text } = arraySetup();
    const first = answers.at(0);
    answers.removeAt(0);
    answers.push(first);
    fixture.detectChanges();
    expect(answers.controls.map(c => c.value)).toEqual(['<p>two</p>', '<p>one</p>']);
    expect(text()).toEqual(['two', 'one']);
  });

  it('does not reset an editor when the same value is written again (re-binding after reorder)', () => {
    const { answers, editors } = arraySetup();
    const editor = (editors()[0].componentInstance as RichTextEditorComponent).tiptap!;
    editor.commands.insertContent('x');
    const doc = editor.state.doc;
    answers.at(0).setValue(answers.at(0).value);
    expect(editor.state.doc).toBe(doc);
  });

  it('validates each entry on its own', () => {
    const { answers, editors } = arraySetup();
    answers.at(0).addValidators(Validators.required);
    answers.at(0).updateValueAndValidity();
    expect(answers.at(0).valid).toBeTrue();
    (editors()[0].componentInstance as RichTextEditorComponent).tiptap!.commands.clearContent(true);
    expect(answers.at(0).value).toBe('');
    expect(answers.at(0).valid).toBeFalse();
    expect(answers.at(1).valid).toBeTrue();
  });
});
