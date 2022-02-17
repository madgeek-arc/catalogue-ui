import {Component, Input, OnInit} from "@angular/core";
import {Field, GroupedFields} from "../../../domain/dynamic-form-model";
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-field-builder',
  templateUrl: './field-builder.component.html'
})

export class FieldBuilderComponent implements OnInit {
  @Input() field: Field;

  showDescription = false;
  showSuggestion = false;

  public editor = ClassicEditor;
  fieldTypes = [{id: 'string', name: 'small Text'}, {id: 'largeText', name: 'largeText'}];

  ngOnInit() {
  }

  showDescriptionField() {
    this.showDescription = !this.showDescription;
    this.field.form.description.text = '';
  }

  showSuggestionField() {
    this.showSuggestion = !this.showSuggestion;
    this.field.form.suggestion.text = '';
  }

}
