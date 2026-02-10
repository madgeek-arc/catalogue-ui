import { Component, inject, Input } from "@angular/core";
import { Section } from "../../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../../services/form-builder.service";

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
  protected fbService = inject(FormBuilderService);
  // @Input() chapter: Section | null = null;

  public editor = ClassicEditor;
}
