import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { FormBuilderService } from "../../../../services/form-builder.service";

@Component(({
  selector: 'app-chapter-settings',
  templateUrl: './chapter-settings.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ],
}))

export class ChapterSettingsComponent {
  protected fbService = inject(FormBuilderService);

  public editor = ClassicEditor;
}
