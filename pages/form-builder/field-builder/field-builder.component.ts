import {Component, Input, OnInit} from "@angular/core";
import {GroupedFields} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-field-builder',
  templateUrl: './field-builder.component.html'
})

export class FieldBuilderComponent implements OnInit {
  @Input() groupedFields: GroupedFields;

  fieldTypes = [{id: 'string', name: 'small Text'}, {id: 'largeText', name: 'largeText'}];

  ngOnInit() {
  }


}
