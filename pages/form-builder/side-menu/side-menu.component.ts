import { Component, inject } from "@angular/core";
import { Field, Section, SelectedSection } from "../../../domain/dynamic-form-model";
import { FormBuilderService } from "../../../services/form-builder.service";

@Component({
    selector: 'app-side-menu',
    templateUrl: './side-menu.component.html',
})

export class SideMenuComponent {
  protected fbService = inject(FormBuilderService);


  pushChapter() {
    this.fbService.addSection();
  }

  deleteChapter(position: number) {
    this.fbService.deleteSection(position);
  }

  addSubSection(position: number) {
    this.fbService.addSubSection(position);
  }

  deleteSubSection(position: number, index: number) {
    this.fbService.deleteSubSection(position, index);
    // this.chapterModel[position].subSections.splice(index, 1);
    //
    // if (this.chapterModel[position].subSections[index]) {
    //   this.emitSelection(this.chapterModel[position], this.chapterModel[position].subSections[index], null, 'section');
    //   return;
    // } else if (this.chapterModel[position].subSections[index-1]) {
    //   this.emitSelection(this.chapterModel[position], this.chapterModel[position].subSections[index-1], null, 'section');
    //   return;
    // }
    //
    // this.emitSelection(this.chapterModel[position], null, null, 'chapter');
    // return;
  }

  emitSelection(chapter: Section, section: Section | null, field: Field | null, type: typeof SelectedSection.prototype.sideMenuSettingsType) {
    this.fbService.setCurrentSelection({chapter: chapter, section: section, field, sideMenuSettingsType: type})
    // this.userSelection.emit({chapter: chapter, section: section, field, sideMenuSettingsType: type});
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
