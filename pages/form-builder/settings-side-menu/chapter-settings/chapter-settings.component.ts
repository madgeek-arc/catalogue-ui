import { Component, Input } from "@angular/core";
import { Section } from "../../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";

@Component(({
  selector: 'app-chapter-settings',
  templateUrl: './chapter-settings.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ],
  standalone: true
}))

export class ChapterSettingsComponent {
  @Input() chapter: Section | null = null;

  public editor = ClassicEditor;
}
