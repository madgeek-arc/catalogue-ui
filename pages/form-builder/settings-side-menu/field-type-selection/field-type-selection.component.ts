import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field, Section, TypeInfo } from "../../../../domain/dynamic-form-model";
import { IdGenerationService } from "../../../../services/id-generation.service";

@Component({
    selector: 'app-field-type-selections',
    templateUrl: './field-type-selector.component.html',
    standalone: false
})

export class FieldTypeSelectionComponent {
  @Input() section: Section | null = null;

  @Output() emitField: EventEmitter<number> = new EventEmitter();

  constructor(private idService: IdGenerationService) { }

  addField(type: typeof TypeInfo.prototype.type) {
    let tmpField: Field = new Field(this.idService.generateId().toString(), type);

    if (this.section.fields === null)
      this.section.fields = [];

    this.section.fields.push(tmpField);
    this.emitField.emit(this.section.fields.length-1);
  }

}
