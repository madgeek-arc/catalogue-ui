import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
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
    CKEditorModule
  ]
})

export class FieldSettingsComponent {
  protected fbService = inject(FormBuilderService);

  @Input() field: Field | null = null;

  public editor = ClassicEditor;

  setVisibility(event: boolean): void {
    this.field.form.display.visible = !event;
  }
}
