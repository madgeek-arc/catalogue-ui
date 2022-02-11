import {Component, Input} from "@angular/core";
import {GroupedFields} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-section-builder',
  templateUrl: 'section-builder.component.html'
})

export class SectionBuilderComponent {

  @Input() section: GroupedFields;


}
