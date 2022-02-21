import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Chapter, Field, GroupedFields} from "../../../domain/dynamic-form-model";

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html'
})

export class SideMenuComponent implements OnInit {

  @Input() chapterModel: Chapter[];
  @Output() showChapterOrSection = new EventEmitter<string>();
  // groups: Group[] = []

  ngOnInit() {
    // this.groups.push(new Group());
  }

  addSection(position) {
    this.chapterModel[position].sections.push(new GroupedFields());
  }

  addField(positionI, positionJ) {
    this.chapterModel[positionI].sections[positionJ].fields.push(new Field());
  }

  pushChapter() {
    this.chapterModel.push(new Chapter());
  }

  deleteChapter(position: number) {
    this.chapterModel.splice(position, 1);
  }

  emitSelection(str: string) {
    this.showChapterOrSection.emit(str);
  }

}
