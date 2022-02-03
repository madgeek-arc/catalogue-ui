import {Component, OnInit} from "@angular/core";
import {ChapterModel} from "../../domain/dynamic-form-model";

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements OnInit {

  formBuilder: ChapterModel[] = [];

  ngOnInit() {
    // this.formBuilder.push();
  }

  pushChapter() {
    this.formBuilder.push(new ChapterModel());
  }

}
