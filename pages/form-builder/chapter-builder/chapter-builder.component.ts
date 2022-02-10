import {Component, Input} from "@angular/core";
import {ChapterModel} from "../../../domain/dynamic-form-model";
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-chapter-builder',
  templateUrl: 'chapter-builder.component.html'
})

export class ChapterBuilderComponent {

  @Input() chapter: ChapterModel = null;

  public editor = ClassicEditor;
}
