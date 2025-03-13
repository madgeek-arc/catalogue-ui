import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Field, Section } from "../../../domain/dynamic-form-model";
import { SelectedSection } from "../form-builder.component";

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html'
})

export class SideMenuComponent implements OnInit {

  @Input() chapterModel: Section[];
  @Output() showChapterOrSection = new EventEmitter<string>();
  @Output() userSelection = new EventEmitter<SelectedSection>();
  // groups: Group[] = []

  ngOnInit() {
    // this.groups.push(new Group());
  }

  pushChapter() {
    this.chapterModel.push(new Section());

    this.emitSelection(this.chapterModel[this.chapterModel.length-1], null, 'chapter');
  }

  deleteChapter(position: number) {
    this.chapterModel.splice(position, 1);

    if (this.chapterModel[position]) {
      this.emitSelection(this.chapterModel[position], null, 'chapter');
      return;
    } else if (this.chapterModel[position-1]) {
      this.emitSelection(this.chapterModel[position-1], null, 'chapter');
      return;
    }

    this.emitSelection(null, null, 'main');
  }

  addSection(position) {
    if (this.chapterModel[position].subSections === null)
      this.chapterModel[position].subSections = [];

    this.chapterModel[position].subSections.push(new Section());

    this.emitSelection(this.chapterModel[position], this.chapterModel[position].subSections[this.chapterModel[position].subSections.length-1], 'section');
  }

  addField(positionI, positionJ) {
    if (this.chapterModel[positionI].subSections[positionJ].fields === null)
      this.chapterModel[positionI].subSections[positionJ].fields = [];

    this.chapterModel[positionI].subSections[positionJ].fields.push(new Field());
  }

  emitSelection(chapter: Section, section: Section | null, type: typeof SelectedSection.prototype.type) {
    this.userSelection.emit({chapter: chapter, section: section, type: type});
  }

}
