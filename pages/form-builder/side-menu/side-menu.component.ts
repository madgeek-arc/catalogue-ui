import {Component, Input, OnInit} from "@angular/core";
import {ChapterModel, Fields, GroupedField} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html'
})

export class SideMenuComponent implements OnInit {

  @Input() chapterModel: ChapterModel[];
  // groups: Group[] = []

  ngOnInit() {
    // this.groups.push(new Group());
  }

  addSection(position) {
    this.chapterModel[position].groupedFieldsList.push(new GroupedField());
  }

  addField(positionI, positionJ) {
    this.chapterModel[positionI].groupedFieldsList[positionJ].fields.push(new Fields());
  }

  pushChapter() {
    this.chapterModel.push(new ChapterModel());
  }

  deleteChapter(position: number) {
    this.chapterModel.splice(position, 1);
  }

}
