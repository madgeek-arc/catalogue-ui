import {Component, Input, OnInit} from "@angular/core";
import {Fields} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-field-section',
  templateUrl: './field-section.component.html'
})

export class FieldSectionComponent implements OnInit {
  @Input() formBuilder: Fields[];


  fieldTypes = [{id: 'string', name: 'small Text'}, {id: 'largeText', name: 'largeText' }];

  ngOnInit() {
  }


}
