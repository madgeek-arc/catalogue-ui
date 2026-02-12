import { Component, EventEmitter, inject, Input, Output, ViewChild } from "@angular/core";
import { CKEditorComponent, CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../services/form-builder.service";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-main-info',
  templateUrl: './main-info.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ]
})

export class MainInfoComponent {
  protected fbService = inject(FormBuilderService);

  public editor = ClassicEditor;

  focusEditor(editor: string) {
    if (this[editor] && this[editor].editorInstance) {
      this[editor].editorInstance.editing.view.focus();
    }
  }
}
