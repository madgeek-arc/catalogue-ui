import { Component, Input, ViewChild } from "@angular/core";
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

  @Input() title: string | null;
  @Input() description: string | null;
  @Input() notice: string | null;

  focusEditor(editor: string) {
    if (this[editor] && this[editor].editorInstance) {
      this[editor].editorInstance.editing.view.focus();
    }
  }
}
