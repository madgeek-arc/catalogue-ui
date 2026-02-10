import { Component, Input } from "@angular/core";
import { Section } from "../../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-section-settings',
  templateUrl: './section-settings.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ]
})

export class SectionSettingsComponent {
  @Input() section: Section | null = null;

  public editor = ClassicEditor;

}
