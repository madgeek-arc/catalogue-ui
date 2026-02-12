import { Component, inject, Input } from "@angular/core";
import { Field, TextProperties } from "../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CommonModule } from "@angular/common";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import {
  CatalogueUiReusableComponentsModule
} from "../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { SafeUrlPipe } from "../../../shared/pipes/safeUrlPipe";
import { FormBuilderService } from "../../../services/form-builder.service";
import { FormsModule } from "@angular/forms";

@Component(({
  selector: 'app-field-templates',
  templateUrl: './field-templates.component.html',
  styleUrl: '../form-builder.component.scss',
  imports: [
    CommonModule,
    CKEditorModule,
    CatalogueUiReusableComponentsModule,
    SafeUrlPipe,
    FormsModule,
  ],
}))

export class FieldTemplatesComponent {
  protected fbService = inject(FormBuilderService);

  @Input() field: Field | null = null;

  public editor = ClassicEditor;

  appendAsterisk(content: string): string {
    const closingTag = '</p>';

    if (content.trim().endsWith(closingTag)) // Insert (*) before the </p>
      return content.replace(/<\/p>\s*$/, ' (*)</p>');
    else // Just append (*) at the end
      return content + ' (*)';
  }

  get textProperties(): TextProperties {
    return this.field?.typeInfo.properties as TextProperties;
  }

}
