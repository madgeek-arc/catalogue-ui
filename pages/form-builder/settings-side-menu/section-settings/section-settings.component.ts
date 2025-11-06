import { Component, Input } from "@angular/core";
import { Section } from "../../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
    selector: 'app-section-settings',
    templateUrl: './section-settings.component.html',
    standalone: false
})

export class SectionSettingsComponent {
  @Input() section: Section | null = null;

  public editor = ClassicEditor;

}
