import { Component, ElementRef, inject, Input, ViewChild } from "@angular/core";
import { Field, FieldType, IdLabel, TextProperties } from "../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { CommonModule } from "@angular/common";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import {
  CatalogueUiReusableComponentsModule
} from "../../../shared/reusable-components/catalogue-ui-reusable-components.module";
import { SafeUrlPipe } from "../../../shared/pipes/safeUrlPipe";
import { FormBuilderService } from "../../../services/form-builder.service";
import { FormsModule } from "@angular/forms";
import { MatCalendar } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from "@angular/material/core";
import UIkit from "uikit";

@Component(({
  selector: 'app-field-templates',
  templateUrl: './field-templates.component.html',
  styleUrl: '../form-builder.component.less',
  imports: [
    CommonModule,
    CKEditorModule,
    CatalogueUiReusableComponentsModule,
    SafeUrlPipe,
    FormsModule,
    MatCalendar,
  ],
  providers: [
    provideNativeDateAdapter(),
  ],
}))

export class FieldTemplatesComponent {
  protected fbService = inject(FormBuilderService);

  @ViewChild('labelInput') inputEl!: ElementRef<HTMLInputElement>;

  @Input() field: Field | null = null;

  public editor = ClassicEditor;

  sameLabelValue: boolean = true;
  option: IdLabel = {id: '', label: ''};
  checkboxLabel: string | null = null;

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


  /** Select and radio button options crud **/
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
    this.inputEl.nativeElement.focus();
  }

  removeOption(index: number) {
    this.field.typeInfo.values.splice(index, 1);
    this.field.typeInfo.values = [...this.field.typeInfo.values];
  }

  move(fromIndex: number, toIndex: number) {
    this.field.typeInfo.values.splice(toIndex, 0, this.field.typeInfo.values.splice(fromIndex, 1)[0]);
  }

  updateValue(index: number, event: string) {
    this.field.typeInfo.values[index].label = event;
    this.field.typeInfo.values[index].id = event;
  }

  /** Check box options crud **/

  addCheckbox() {
    this.fbService.addFieldToComposite(FieldType.checkbox, false, this.checkboxLabel);
    this.checkboxLabel = null;
  }

  deleteCheckbox(index: number) {
    this.fbService.deleteField(index, this.field);
  }

  moveCheckbox(fromIndex: number, toIndex: number) {
    this.fbService.move(fromIndex, toIndex, this.field);
  }
}
