import { Component, computed, inject } from "@angular/core";
import { Field, Section, SelectedSection } from "../../../domain/dynamic-form-model";
import { FormBuilderService } from "../../../services/form-builder.service";

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  imports: []
})

export class SideMenuComponent {
  protected fbService = inject(FormBuilderService);

  highlightedId = computed(() => {
    const currentField = this.fbService.currentField();
    if (currentField) {
      const subsection = this.fbService.currentSubsection();
      if (subsection?.fields) {
        for (const field of subsection.fields) {
          if (this.containsField(field, currentField.id)) {
            return field.id;
          }
        }
      }
      return currentField.id;
    }
    return this.fbService.currentSubsection()?.id
      ?? this.fbService.currentSection()?.id
      ?? null;
  });

  // Recursively checks if a field is contained in a subsection
  private containsField(field: Field, targetId: string): boolean {
    if (field.id === targetId) return true;
    if (field.subFields) {
      return field.subFields.some(f => this.containsField(f, targetId));
    }
    return false;
  }

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
  }

  emitSelection(chapter: Section, section: Section | null, field: Field | null, type: typeof SelectedSection.prototype.sideMenuSettingsType) {
    this.fbService.setCurrentSelection({chapter: chapter, section: section, field, sideMenuSettingsType: type})
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
