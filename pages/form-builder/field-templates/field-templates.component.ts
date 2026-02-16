import { Component, inject, Input } from "@angular/core";
import { Field, IdLabel, TextProperties } from "../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CommonModule } from "@angular/common";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import {
  CatalogueUiReusableComponentsModule
} from "../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { SafeUrlPipe } from "../../../shared/pipes/safeUrlPipe";
import { FormBuilderService } from "../../../services/form-builder.service";
import { FormsModule } from "@angular/forms";
import UIkit from "uikit";
import { NgSelectComponent } from "@ng-select/ng-select";

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
    NgSelectComponent,
  ],
}))

export class FieldTemplatesComponent {
  protected fbService = inject(FormBuilderService);

  @Input() field: Field | null = null;

  public editor = ClassicEditor;

  sameLabelValue: boolean = true;
  option: IdLabel = {id: '', label: ''};

  message: string | null = null;

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

  addOption() {
    if (this.sameLabelValue)
      this.option.id = this.option.label;

    if (!this.option.label) {
      this.message = 'Please enter a label';
    } else if (!this.option.id) {
      this.message = 'Please enter a value'
    }

    if (this.message) {
      UIkit.notification.closeAll();
      UIkit.notification({message: this.message, status: 'warning'});
      this.message = null;
      return;
    }

    this.field.typeInfo.values.push(this.option);
    this.field.typeInfo.values = [...this.field.typeInfo.values];
    this.option = {id: '', label: ''};
  }

}
