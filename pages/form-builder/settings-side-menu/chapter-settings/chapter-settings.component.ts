import { Component, Input } from "@angular/core";
import { Section } from "../../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component(({
  selector: 'app-chapter-settings',
  templateUrl: './chapter-settings.component.html',
}))

export class ChapterSettingsComponent {
  @Input() chapter: Section | null = null;

  public editor = ClassicEditor;
}
