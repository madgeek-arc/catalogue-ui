import { Component, computed, inject, Input } from "@angular/core";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";
import { Dependent, Field } from "../../../../domain/dynamic-form-model";
import { FormBuilderService } from "../../../../services/form-builder.service";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent } from "@ng-select/ng-select";
import { stripHtml } from "../../../../shared/utils/utils";

@Component({
  selector: 'app-field-settings',
  templateUrl: './field-settings.component.html',
  imports: [
    FormsModule,
    CKEditorModule,
    NgSelectComponent,
    NgLabelTemplateDirective,
    NgOptionTemplateDirective,
  ]
})

export class FieldSettingsComponent {

  protected readonly stripHtml = stripHtml;
  protected fbService = inject(FormBuilderService);

  public editor = ClassicEditor;

  @Input() field: Field | null = null;

  options = computed(() => {
    if (['string', 'largeText', 'richText', 'url', 'date', 'number'].includes(this.fbService.currentField().typeInfo.type))
      return [
        {label: 'Simple input', value: 'string'},
        {label: 'Rich text', value: 'richText'},
        {label: 'Text area', value: 'largeText'},
        {label: 'Date input', value: 'date'},
        {label: 'Number input', value: 'number'}
      ];
    else if (['radio', 'select'].includes(this.fbService.currentField().typeInfo.type))
      return [{label: 'Radio buttons', value: 'radio'}, {label: 'Drop down', value: 'select'}];
    return []
  });

  dependsOn = computed(() => {
    console.log(this.fbService.currentField().form.dependsOn);
    return !!this.fbService.currentField().form.dependsOn;

  });

  enableList = this.dependsOn();
  dependsOnList: Field[] = [];

  setVisibility(event: boolean): void {
    this.field.form.display.visible = !event;
  }

  getPossibleFields() {
    console.log(this.fbService.getFieldsAtSameLevel(this.fbService.currentField()));
    return this.fbService.getFieldsAtSameLevel(this.fbService.currentField());
  }


  enableFieldList(event: Event) {
    console.log((event.target as HTMLInputElement).checked);
    let checked = (event.target as HTMLInputElement).checked;
    this.enableList = checked;
    if (checked) {
      this.dependsOnList = this.getPossibleFields();
    } else
      this.dependsOnList = [];
  }

  setDependsOn(event: Field) {
    this.field.form.dependsOn = {
      id: event.id,
      name: event.name,
      value: null
    };
  }
}
