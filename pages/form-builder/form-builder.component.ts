import { AfterViewInit, Component, OnInit } from "@angular/core";
import { Model } from "../../domain/dynamic-form-model";
import UIkit from 'uikit';

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements AfterViewInit {

  model: Model = new Model();
  show: string = 'chapter';

  ngAfterViewInit() {
    UIkit.modal('#fb-modal-full').show();
  }

  updateView(show: string) {
    this.show = show;
  }

}
