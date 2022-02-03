import {Component, Input, OnInit} from "@angular/core";
import {ChapterModel, GroupedField} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-field-builder',
  templateUrl: './field-builder.component.html'
})

export class FieldBuilderComponent implements OnInit {
  @Input() groupedFields: GroupedField;

  fieldTypes = [{id: 'string', name: 'small Text'}, {id: 'largeText', name: 'largeText'}];

  ngOnInit() {
  }


}
