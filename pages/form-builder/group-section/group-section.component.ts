import {Component, Input, OnInit} from "@angular/core";
import {ChapterModel, Group, GroupedField} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-group-section',
  templateUrl: './group-section.component.html'
})

export class GroupSectionComponent implements OnInit {

  @Input() chapterModel: ChapterModel[];
  // groups: Group[] = []

  ngOnInit() {
    // this.groups.push(new Group());
  }

  addSection(position) {
    this.chapterModel[position].groupedFieldsList.push(new GroupedField());
  }

}
