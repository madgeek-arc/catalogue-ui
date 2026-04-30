import { Component, inject } from "@angular/core";
import { FieldType } from "../../../../domain/dynamic-form-model";
import { FormBuilderService } from "../../../../services/form-builder.service";

@Component({
    selector: 'app-field-type-selections',
    templateUrl: './field-type-selector.component.html',
})

export class FieldTypeSelectorComponent {
  private fbService = inject(FormBuilderService);

  protected readonly FieldType = FieldType;

  addField(type: FieldType) {
    if (this.fbService.currentField()?.typeInfo.type === 'composite') {
      this.fbService.addFieldToComposite(type, type === FieldType.checkbox);
    } else
      this.fbService.addField(type);
  }
}
