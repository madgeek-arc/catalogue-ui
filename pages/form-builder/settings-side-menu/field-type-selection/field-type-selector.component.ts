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
    // console.log(this.fbService.currentField().typeInfo.type);
    if (this.fbService.currentField()?.typeInfo.type === 'composite') {
      console.log('Adding to composite');
      this.fbService.addFieldToComposite(type);
    } else
      this.fbService.addField(type);
  }
}
