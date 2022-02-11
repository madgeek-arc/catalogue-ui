import {Component, OnInit} from "@angular/core";
import {Chapter} from "../../domain/dynamic-form-model";

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements OnInit {

  formBuilder: Chapter[] = [];

  ngOnInit() {
    // this.formBuilder.push();
  }

  pushChapter() {
    this.formBuilder.push(new Chapter());
  }

}
