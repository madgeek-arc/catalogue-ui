import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Field, Section, SelectedSection } from "../../../domain/dynamic-form-model";

@Component({
    selector: 'app-side-menu',
    templateUrl: './side-menu.component.html',
})

export class SideMenuComponent {

  @Input() chapterModel: Section[];
  @Output() userSelection = new EventEmitter<SelectedSection>();


  pushChapter() {
    this.chapterModel.push(new Section());

    this.emitSelection(this.chapterModel[this.chapterModel.length-1], null, null, 'chapter');
  }

  deleteChapter(position: number) {
    this.chapterModel.splice(position, 1);

    if (this.chapterModel[position]) {
      this.emitSelection(this.chapterModel[position], null, null, 'chapter');
      return;
    } else if (this.chapterModel[position-1]) {
      this.emitSelection(this.chapterModel[position-1], null, null, 'chapter');
      return;
    }

    this.emitSelection(null, null, null, 'main');
  }

  addSection(position: number) {
    if (this.chapterModel[position].subSections === null)
      this.chapterModel[position].subSections = [];

    this.chapterModel[position].subSections.push(new Section());

    this.emitSelection(this.chapterModel[position], this.chapterModel[position].subSections[this.chapterModel[position].subSections.length-1], null, 'section');
  }

  deleteSection(position: number, index: number) {
    this.chapterModel[position].subSections.splice(index, 1);

    if (this.chapterModel[position].subSections[index]) {
      this.emitSelection(this.chapterModel[position], this.chapterModel[position].subSections[index], null, 'section');
      return;
    } else if (this.chapterModel[position].subSections[index-1]) {
      this.emitSelection(this.chapterModel[position], this.chapterModel[position].subSections[index-1], null, 'section');
      return;
    }

    this.emitSelection(this.chapterModel[position], null, null, 'chapter');
    return;
  }

  emitSelection(chapter: Section, section: Section | null, field: Field | null, type: typeof SelectedSection.prototype.sideMenuSettingsType) {
    this.userSelection.emit({chapter: chapter, section: section, field, sideMenuSettingsType: type});
  }

  unwrapOuterParagraph(html?: string): string {
    if (!html) {
      return 'Untitled question';
    }

    return html
      .replace(/^<p[^>]*>/i, '')   // remove first opening <p ...>
      .replace(/<\/p>\s*$/i, '');  // remove last closing </p>
  }

}
