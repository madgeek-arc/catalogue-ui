import { Component, inject } from "@angular/core";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../services/form-builder.service";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import type { Editor } from '@ckeditor/ckeditor5-core';

@Component({
  selector: 'app-main-info',
  standalone: true,
  templateUrl: './main-info.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ]
})

export class MainInfoComponent {
  protected fbService = inject(FormBuilderService);

  public editor = ClassicEditor;

  editors: Record<string, any> = {
    descriptionEditor: ClassicEditor,
    noticeEditor: ClassicEditor,
  };

  focusEditor(editor: string) {
    const instance = this.editors[editor];

    if (instance?.editorInstance) {
      instance.editorInstance.editing.view.focus();
    }
  }
}
