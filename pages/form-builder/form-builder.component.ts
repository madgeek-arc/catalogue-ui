import {Component, OnInit} from "@angular/core";
import {Field, Fields} from "../../domain/dynamic-form-model";

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements OnInit {

  formBuilder: Fields[] = [];

  ngOnInit() {
    this.formBuilder.push(new Fields());
  }

  pushField() {
    this.formBuilder.push(new Fields());
  }
}
