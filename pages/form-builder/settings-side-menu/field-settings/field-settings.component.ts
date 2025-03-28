import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field } from "../../../../domain/dynamic-form-model";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-field-settings',
  templateUrl: './field-settings.component.html',
})

export class FieldSettingsComponent {

  @Input() field: Field | null = null;

  @Output() emitField: EventEmitter<void> = new EventEmitter();


  public editor = ClassicEditor;

  setPlaceholderWithReferenceUpdate() {
    // console.log(newPlaceholder);

    this.emitField.emit()
  }

  setVisibility(event: boolean): void {
    this.field.form.display.visible = !event;
  }
}
