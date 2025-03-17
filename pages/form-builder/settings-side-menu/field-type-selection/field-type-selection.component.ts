import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field, Section, TypeInfo } from "../../../../domain/dynamic-form-model";

@Component({
  selector: 'app-field-type-selections',
  templateUrl: './field-type-selector.component.html'
})

export class FieldTypeSelectionComponent {
  @Input() section: Section | null = null;

  @Output() emitField: EventEmitter<number> = new EventEmitter();

  addField(type: typeof TypeInfo.prototype.type) {
    let tmpField: Field = new Field(type);

    if (this.section.fields === null)
      this.section.fields = [];

    this.section.fields.push(tmpField);
    this.emitField.emit(this.section.fields.length-1);
  }

}
