import {Component, OnInit} from "@angular/core";
import {Group} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-group-section',
  templateUrl: './group-section.component.html'
})

export class GroupSectionComponent implements OnInit {

  groups: Group[] = []

  ngOnInit() {
    this.groups.push(new Group());
  }

}
