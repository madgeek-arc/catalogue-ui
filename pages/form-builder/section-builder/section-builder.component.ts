import {Component, Input} from "@angular/core";
import {GroupedFields} from "../../../domain/dynamic-form-model";
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-section-builder',
  templateUrl: 'section-builder.component.html'
})

export class SectionBuilderComponent {

  @Input() section: GroupedFields;

  public editor = ClassicEditor;

}
