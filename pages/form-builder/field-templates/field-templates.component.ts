import { Component, Input, OnInit } from "@angular/core";
import { Field, PatternProperties, TextProperties, TypeProperties } from "../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CommonModule, NgClass, NgIf, NgSwitch, NgSwitchCase } from "@angular/common";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import {
  CatalogueUiReusableComponentsModule
} from "../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { SafeUrlPipe } from "../../../shared/pipes/safeUrlPipe";
import editor from "@ckeditor/ckeditor5-build-classic";

@Component(({
  selector: 'app-field-templates',
  templateUrl: './field-templates.component.html',
  imports: [
    CommonModule,
    CKEditorModule,
    CatalogueUiReusableComponentsModule,
    SafeUrlPipe,
  ],
  standalone: true
}))

export class FieldTemplatesComponent {
  @Input() fieldData: Field;
  @Input() readonly!: boolean;

  properties: TypeProperties  = {};

  public editor = ClassicEditor;

  appendAsterisk(content: string): string {
    const closingTag = '</p>';

    if (content.trim().endsWith(closingTag)) // Insert (*) before the </p>
      return content.replace(/<\/p>\s*$/, ' (*)</p>');
    else // Just append (*) at the end
      return content + ' (*)';
  }

  get textProperties(): TextProperties {
    return this.properties as TextProperties;
  }

}
