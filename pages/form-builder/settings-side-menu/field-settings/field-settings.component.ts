import { Component, computed, inject, Input } from "@angular/core";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { FormsModule } from "@angular/forms";
import { Field } from "../../../../domain/dynamic-form-model";
import { FormBuilderService } from "../../../../services/form-builder.service";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-field-settings',
  templateUrl: './field-settings.component.html',
  imports: [
    FormsModule,
    CKEditorModule,
  ]
})

export class FieldSettingsComponent {
  protected fbService = inject(FormBuilderService);

  options = computed(() => {
    if (['string', 'largeText', 'richText', 'url' ].includes(this.fbService.currentField().typeInfo.type))
      return [{label: 'Simple input', value: 'string'}, {label: 'Rich text', value: 'richText'}, {label: 'Text area', value: 'largeText'}];
    else if (['radio', 'select' ].includes(this.fbService.currentField().typeInfo.type))
      return [{label: 'Radio buttons', value: 'radio'}, {label: 'Drop down', value: 'select'}];
    return []
  });

  @Input() field: Field | null = null;

  public editor = ClassicEditor;

  setVisibility(event: boolean): void {
    this.field.form.display.visible = !event;
  }
}
