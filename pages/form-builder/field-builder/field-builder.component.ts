import {Component, Input, OnInit} from "@angular/core";
import {GroupedFields} from "../../../domain/dynamic-form-model";
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-field-builder',
  templateUrl: './field-builder.component.html'
})

export class FieldBuilderComponent implements OnInit {
  @Input() groupedFields: GroupedFields;

  public editor = ClassicEditor;
  fieldTypes = [{id: 'string', name: 'small Text'}, {id: 'largeText', name: 'largeText'}];

  ngOnInit() {
  }


}
