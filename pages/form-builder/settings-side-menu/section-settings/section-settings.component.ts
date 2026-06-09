import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FormBuilderService } from "../../../../services/form-builder.service";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

@Component({
  selector: 'app-section-settings',
  templateUrl: './section-settings.component.html',
  imports: [
    CKEditorModule,
    FormsModule
  ]
})

export class SectionSettingsComponent {
  protected fbService = inject(FormBuilderService);

  public editor = ClassicEditor;

}

// Version with current ckeditor
//
// import { Component, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { FormBuilderService } from '../../../../services/form-builder.service';
// import { ClassicEditor, Bold, Essentials, Italic, Paragraph } from 'ckeditor5';
// import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
//
// @Component({
//   selector: 'app-section-settings',
//   templateUrl: './section-settings.component.html',
//   imports: [CKEditorModule, FormsModule],
// })
// export class SectionSettingsComponent {
//   public editor = ClassicEditor;
//   public config = {
//     licenseKey: 'GPL',
//     plugins: [Essentials, Paragraph, Bold, Italic],
//     toolbar: ['undo', 'redo', '|', 'bold', 'italic', '|', 'formatPainter'],
//     placeholder: 'Give a short description for the section',
//   };
//
//   protected fbService = inject(FormBuilderService);
// }
