import { Component, computed, effect, inject, signal } from "@angular/core";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";
import { Field } from "../../../../domain/dynamic-form-model";
import { FormBuilderService } from "../../../../services/form-builder.service";
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent } from "@ng-select/ng-select";
import { stripHtml } from "../../../../shared/utils/utils";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-field-settings',
  standalone: true,
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

  protected fbService = inject(FormBuilderService);
  protected readonly stripHtml = stripHtml;

  public editor = ClassicEditor;

  options = computed(() => {
    if (['string', 'largeText', 'richText', 'url', 'date', 'number'].includes(this.fbService.currentField()?.typeInfo.type as string))
      return [
        {label: 'Simple input', value: 'string'},
        {label: 'Rich text', value: 'richText'},
        {label: 'Text area', value: 'largeText'},
        {label: 'Date input', value: 'date'},
        {label: 'Number input', value: 'number'}
      ];
    else if (['radio', 'select'].includes(this.fbService.currentField()?.typeInfo.type as string))
      return [{label: 'Radio buttons', value: 'radio'}, {label: 'Drop down', value: 'select'}];
    return []
  });

  enableList = signal(false);
  dependsOnList = computed(() => {
    if (this.enableList())
      return this.getPossibleFields();

    return [];
  });

  dependsOnSelection: string | null = null;
  dependsOnValue: string | null = null;
  dependsOnField: Field | null = null;

  private syncEffect = effect(() => {
    const field = this.fbService.currentField();
    if (field) {
      this.enableList.set(!!field.form.dependsOn);

      if (field.form.dependsOn?.id) {
        this.dependsOnField = this.dependsOnList().find(f => f.id === field.form.dependsOn?.id) || null;
      } else {
        this.dependsOnField = null;
      }

      if (field.form.dependsOn?.value)
        this.dependsOnSelection = 'specificValue';
      else if (field.form.dependsOn?.id)
        this.dependsOnSelection = 'anyValue';
      else
        this.dependsOnSelection = null;
    }
  });

  setVisibility(event: boolean): void {
    const field = this.fbService.currentField();
    if (!field?.form) return;
    field.form.display.visible = !event;
  }

  getPossibleFields() {
    return this.fbService.getFieldsAtSameLevel(this.fbService.currentField());
  }


  enableFieldList(event: Event) {
    this.enableList.set((event.target as HTMLInputElement).checked);
    if (!this.enableList()) {
      const field = this.fbService.currentField();
      if (field?.form)
        field.form.dependsOn = null;
      this.dependsOnSelection = null;
      this.dependsOnField = null;
    }
  }

  setDependsOn(event: Field) {
    const field = this.fbService.currentField();
    if (!field?.form) return;

    if (!event) {
      field.form.dependsOn = null;
      this.dependsOnField = null;
      this.dependsOnSelection = null;
      return;
    }
    field.form.dependsOn = {
      id: event.id,
      name: event.name,
      value: null
    };
    this.dependsOnField = event;
    this.dependsOnSelection = 'anyValue';
  }

  initDependsOnValue(event: Event) {
    const field = this.fbService.currentField();
    if (!field?.form.dependsOn?.value) return;
    const value = (event.target as HTMLInputElement).value;
    if (value === 'specificValue') {
      field.form.dependsOn.value = [];
    } else if (value === 'anyValue') {
      field.form.dependsOn.value = null;
    }
  }

  addDependsOnValue() {
    const field = this.fbService.currentField();
    if (!field?.form.dependsOn?.value) return;

    if (this.dependsOnValue && this.dependsOnValue.trim() !== '') {
      if (!Array.isArray(field.form.dependsOn.value))
        field.form.dependsOn.value = [this.dependsOnValue];
      else
        field.form.dependsOn.value.push(this.dependsOnValue);

      this.dependsOnValue = null;
    }
  }


  removeDependsOnValue(value: string) {
    const field = this.fbService.currentField();
    if (field?.form?.dependsOn) {
      if (Array.isArray(field.form.dependsOn.value)) {
        field.form.dependsOn.value = field.form.dependsOn.value.filter(v => v !== value);
      } else if (field.form.dependsOn.value === value) {
        field.form.dependsOn.value = null;
      }
    }
  }
}
