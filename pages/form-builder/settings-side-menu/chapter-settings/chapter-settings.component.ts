import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../../services/form-builder.service";
import { RichTextEditorComponent } from "../../../../shared/reusable-components/rich-text-editor/rich-text-editor.component";

@Component(({
  selector: 'app-chapter-settings',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  templateUrl: './chapter-settings.component.html',
  imports: [
    RichTextEditorComponent,
    FormsModule
  ],
}))

export class ChapterSettingsComponent {
  protected fbService = inject(FormBuilderService);
}
