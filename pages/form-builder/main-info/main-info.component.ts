import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditorComponent } from "@ckeditor/ckeditor5-angular";

@Component({
  selector: 'app-main-info',
  templateUrl: './main-info.component.html',
})

export class MainInfoComponent {
  @ViewChild('descriptionEditor') descriptionEditor!: CKEditorComponent;
  @ViewChild('noticeEditor') noticeEditor!: CKEditorComponent;

  public editor = ClassicEditor;

  @Input() formTitle: string | null = null;
  @Input() description: string | null = null;
  @Input() notice: string | null = null;

  @Output() emitTitle: EventEmitter<string> = new EventEmitter();
  @Output() emitDescription: EventEmitter<string> = new EventEmitter();
  @Output() emitNotice: EventEmitter<string> = new EventEmitter();

  focusEditor(editor: string) {
    if (this[editor] && this[editor].editorInstance) {
      this[editor].editorInstance.editing.view.focus();
    }
  }

  titleChange(value: string) {
    this.formTitle = value;
    this.emitTitle.emit(value);
  }

  descriptionChange(value: string) {
    this.description = value;
    this.emitDescription.emit(value);
  }

  noticeChange(value: string) {
    this.notice = value;
    this.emitNotice.emit(value);
  }
}
