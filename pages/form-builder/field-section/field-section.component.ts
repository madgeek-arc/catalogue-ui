import {Component, Input, OnInit} from "@angular/core";
import {ChapterModel, GroupedField} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-field-section',
  templateUrl: './field-section.component.html'
})

export class FieldSectionComponent implements OnInit {
  @Input() groupedFields: GroupedField;

  fieldTypes = [{id: 'string', name: 'small Text'}, {id: 'largeText', name: 'largeText'}];

  ngOnInit() {
  }


}
