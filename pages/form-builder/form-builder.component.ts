import { AfterViewInit, Component } from "@angular/core";
import { Model, Section } from "../../domain/dynamic-form-model";
import UIkit from 'uikit';

export class SelectedSection {
  chapter: Section | null = null;
  section: Section | null = null;
  type: 'main' | 'chapter' | 'section' = 'main';
}

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html'
})

export class FormBuilderComponent implements AfterViewInit {

  model: Model = new Model();
  chapter: Section | null = null;
  section: Section | null = null;
  type: 'main' | 'chapter' | 'section' = 'main';
  show: string = 'chapter';

  ngAfterViewInit() {
    UIkit.modal('#fb-modal-full').show();
  }

  updateView(show: string) {
    this.show = show;
  }

  setCurrentSection(selection: SelectedSection) {
    this.chapter = this.section = null

    this.chapter = selection.chapter;
    if (selection.section) {
      this.section = selection.section;
    }
    this.type = selection.type;

  }
}
