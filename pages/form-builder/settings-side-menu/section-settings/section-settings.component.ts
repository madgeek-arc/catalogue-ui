import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../../services/form-builder.service";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-section-settings',
  templateUrl: './section-settings.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ]
})

export class SectionSettingsComponent {
  protected fbService = inject(FormBuilderService);

  public editor = ClassicEditor;

}
