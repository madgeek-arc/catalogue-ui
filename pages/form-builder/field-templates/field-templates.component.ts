import { Component, Input } from "@angular/core";
import { Field } from "../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component(({
  selector: 'app-field-templates',
  templateUrl: './field-templates.component.html',
}))

export class FieldTemplatesComponent {
  @Input() fieldData: Field;
  @Input() readonly!: boolean;

  public editor = ClassicEditor;

  appendAsterisk(content: string): string {
    const closingTag = '</p>';

    if (content.trim().endsWith(closingTag)) // Insert (*) before the </p>
      return content.replace(/<\/p>\s*$/, ' (*)</p>');
    else // Just append (*) at the end
      return content + ' (*)';
  }

}
