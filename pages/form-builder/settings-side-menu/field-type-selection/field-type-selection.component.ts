import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field, FieldType, Section } from "../../../../domain/dynamic-form-model";
import { IdGenerationService } from "../../../../services/id-generation.service";

@Component({
    selector: 'app-field-type-selections',
    templateUrl: './field-type-selector.component.html',
    standalone: false
})

export class FieldTypeSelectionComponent {
  @Input() section: Section | null = null;

  @Output() emitField: EventEmitter<number> = new EventEmitter();

  protected readonly FieldType = FieldType;

  constructor(private idService: IdGenerationService) { }

  addField(type: FieldType) {
    let tmpField: Field = new Field(this.idService.generateId().toString(), type);

    if (this.section.fields === null)
      this.section.fields = [];

    this.section.fields.push(tmpField);
    this.emitField.emit(this.section.fields.length-1);
  }

}
