import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JsonPipe, Location, NgClass, NgStyle } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Field, Model } from '../../domain/dynamic-form-model';
import { DynamicCatalogueService } from '../../services/dynamic-catalogue.service';
import { FormBuilderService } from '../../services/form-builder.service';
import { FileDownloadService } from '../../services/file-download.service';
import { SettingsSideMenuComponent } from './settings-side-menu/settings-side-menu.component';
import { FieldTemplatesComponent } from './field-templates/field-templates.component';
import { SideMenuComponent } from './side-menu/side-menu.component';
import { MainInfoComponent } from './main-info/main-info.component';
import { DynamicFormModule } from '../dynamic-form/dynamic-form.module';
import { WebsocketService } from '../../services/websocket.service';
import UIkit from 'uikit';
import UIkitModalElement = UIkit.UIkitModalElement;

@Component({
  selector: 'app-form-builder',
  standalone: true,
  templateUrl: 'form-builder.component.html',
  styleUrls: ['form-builder.component.less'],
  providers: [WebsocketService],
  imports: [
    NgClass,
    NgStyle,
    FormsModule,
    SideMenuComponent,
    MainInfoComponent,
    FieldTemplatesComponent,
    SettingsSideMenuComponent,
    JsonPipe,
    DynamicFormModule,
  ],
})
export class FormBuilderComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private catalogueService = inject(DynamicCatalogueService);
  private fileDownloadService = inject(FileDownloadService);
  protected fbService = inject(FormBuilderService);

  @ViewChild('modalPreview') formPreviewModalElement!: ElementRef;
  @ViewChild('modalJson') jsonModalElement!: ElementRef;

  customActions = input<boolean>(false);
  backDestination = input<string | null>(null);
  saveAction = output<Model>();

  loading = signal(false);
  error = signal<string | null>(null);

  // Counts shown in the survey meta bar
  sectionsCount = computed(() => this.fbService.model()?.sections?.length ?? 0);
  subsectionsCount = computed(() =>
    (this.fbService.model()?.sections ?? []).reduce((sum, s) => sum + (s.subSections?.length ?? 0), 0)
  );
  fieldsCount = computed(() =>
    (this.fbService.model()?.sections ?? []).reduce((sum, s) =>
      sum + (s.subSections ?? []).reduce((sSum, sub) => sSum + (sub.fields?.length ?? 0), 0), 0)
  );

  editMode = false;
  jsonModal!: UIkitModalElement;
  formPreviewModal!: UIkitModalElement;
  showPreview = signal(false);

  ngAfterViewInit(): void {
    const element = this.formPreviewModalElement.nativeElement;

    // Create UIkit modal instances
    this.formPreviewModal = UIkit.modal(element);
    this.jsonModal = UIkit.modal(this.jsonModalElement.nativeElement);

    element.addEventListener('beforeshow', this.onBeforeShow);
    element.addEventListener('hidden', this.onHidden);
  }

  ngOnInit() {
    // if (this.route.snapshot.routeConfig?.path === 'fb/new-form') {
    //   this.fbService.setModel();
    //   this.editMode = false;
    // } else {

    if (!this.fbService.model()) {
      this.route.paramMap
        .pipe(
          map((params) => params.get('id')),
          // filter(Boolean),
          tap(() => this.loading.set(true)),
          switchMap((id: string) => {
            if (!id) {
              return of(undefined);
            }
            this.editMode = true;
            return this.catalogueService.getFormModel(id);
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (model) => {
            console.log(model);
            this.initModel(model);
            this.loading.set(false);
          },
          error: (err) => {
            // this.error.set('Failed to load model: ' + err.message + '');
            this.loading.set(false);
          },
        });
    }
    // }
  }

  ngOnDestroy(): void {
    const formModal = this.formPreviewModalElement?.nativeElement;
    if (formModal) {
      formModal.removeEventListener('beforeshow', this.onBeforeShow);
      formModal.removeEventListener('hidden', this.onHidden);
    }
    if (this.formPreviewModal) {
      try {
        this.formPreviewModal.hide();
        this.formPreviewModal.$destroy(true); // also removes the element from the DOM.
      } catch {}
    }

    if (this.jsonModal) {
      try {
        this.jsonModal.hide();
        this.jsonModal.$destroy(true); // also removes the element from the DOM.
      } catch {}
    }
  }

  initModel(model: Model) {
    this.fbService.setModel(model);
  }

  saveModel() {
    if (!this.fbService.model()) return;

    if (this.customActions) this.saveAction.emit(this.fbService.model());
    else
      this.catalogueService.saveModel(this.fbService.model(), this.editMode).subscribe({
        next: () => {
          this.router.navigate(['/fb']).then();
        },
        error: (err) => {
          this.error.set('Failed to save model: ' + err.message + '');
        },
      });
  }

  // "General settings": jump back to landing view of fb (no chapter/subsection/field selected), along with the settings right panel
  showGeneralSettings() {
    this.fbService.setCurrentSelection({chapter: null, section: null, field: null, sideMenuSettingsType: 'main'});
  }

  goBack() {
    const dest = this.backDestination();
    if (dest) {
      this.router.navigateByUrl(dest);
    } else {
      this.location.back();
    }
  }

  // Selecting a top tab (chapter): jump straight into its first subsection when it has one, otherwise fall back to the chapter settings view.
  selectChapter(chapter: any) {
    const firstSub = chapter?.subSections?.[0] ?? null;
    this.fbService.setCurrentSelection({
      chapter,
      section: firstSub,
      field: null,
      sideMenuSettingsType: firstSub ? 'section' : 'chapter',
    });
  }

  fieldSelection(field: Field) {
    this.fbService.fieldSelection(field);
  }

  deleteField(i: number, parentField?: Field) {
    this.fbService.deleteField(i, parentField);
  }

  duplicateField(f: Field, parentField?: Field) {
    this.fbService.duplicateField(f, parentField);
  }

  move(a: number, b: number, parentField?: Field) {
    this.fbService.move(a, b, parentField);
  }

  // Modal
  hideModal(id: string) {
    let el = document.getElementById(id);
    if (el) UIkit.modal(el).hide();
  }

  onBeforeShow = (event: any) => {
    if (event.target === this.formPreviewModalElement.nativeElement) {
      this.showPreview.set(true);
    }
  };

  onHidden = (event: any) => {
    if (event.target === this.formPreviewModalElement.nativeElement) {
      this.showPreview.set(false);
    }
  };

  // Other
  downloadJson() {
    this.fileDownloadService.downloadJson(this.fbService.model());
  }
}
