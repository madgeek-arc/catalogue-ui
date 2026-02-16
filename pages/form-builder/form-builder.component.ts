import { Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { DatePipe, JsonPipe, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Field, Model } from "../../domain/dynamic-form-model";
import { Paging } from "../../domain/paging";
import { DynamicCatalogueService } from "../../services/dynamic-catalogue.service";
import { FormControlService } from "../../services/form-control.service";
import { FormBuilderService } from "../../services/form-builder.service";
import { SettingsSideMenuComponent } from "./settings-side-menu/settings-side-menu.component";
import { FieldTemplatesComponent } from "./field-templates/field-templates.component";
import { SideMenuComponent } from "./side-menu/side-menu.component";
import { MainInfoComponent } from "./main-info/main-info.component";
import { debounceTime, distinctUntilChanged, switchMap, tap } from "rxjs/operators";
import { combineLatest } from "rxjs";
import UIkit from "uikit";

@Component({
  selector: 'app-form-builder',
  templateUrl: 'form-builder.component.html',
  styleUrls: ['form-builder.component.scss'],
  providers: [FormControlService],
  imports: [
    NgClass,
    FormsModule,
    JsonPipe,
    SideMenuComponent,
    MainInfoComponent,
    FieldTemplatesComponent,
    SettingsSideMenuComponent,
    DatePipe
  ]
})

export class FormBuilderComponent implements OnInit {
  private destroyRef = inject(DestroyRef)
  private catalogueService = inject(DynamicCatalogueService);
  protected fbService = inject(FormBuilderService);

  // State signals
  paging = signal<Paging<Model>>(null);
  from = signal(0);
  quantity = signal(3);
  sortBy = signal<'name' | 'creationDate'>('creationDate');
  order = signal<'asc' | 'desc'>('desc');
  keyword = signal<string>('');
  page = computed(() => {
    return this.from() / this.quantity();
  });

  refresh = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);


  private from$ = toObservable(this.from);
  private quantity$ = toObservable(this.quantity);
  private sortBy$ = toObservable(this.sortBy);
  private order$ = toObservable(this.order);
  private keyword$ = toObservable(this.keyword).pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
  private refresh$ = toObservable(this.refresh);

  editMode = false;

  ngOnInit() {

    combineLatest([this.from$, this.quantity$, this.sortBy$, this.order$, this.keyword$, this.refresh$])
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(([from, quantity, sortBy, order, keyword]) =>
          this.catalogueService.getFormModels(from, quantity, sortBy, order, keyword)
        ),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (paging) => {
          this.paging.set(paging);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load models: ' + err.message + '');
          this.loading.set(false);
        }
      });

  }

  initModel(model?: Model) {
    this.editMode = !!model;

    this.fbService.setModel(model);
  }

  saveModel() {
    this.catalogueService.postFormModel(this.fbService.model(), this.editMode).subscribe({
      next: () => {
        this.manualRefresh();
        this.hideModal();
      },
      error: (err) => {
        this.error.set('Failed to save model: ' + err.message + '');
      }
    });
  }

  fieldSelection(field: Field) { this.fbService.fieldSelection(field); }
  deleteField(i: number, parentField?: Field) { this.fbService.deleteField(i, parentField); }
  duplicateField(f: Field, parentField?: Field) { this.fbService.duplicateField(f, parentField); }
  move(a: number, b: number, parentField?: Field) { this.fbService.move(a, b, parentField); }
  // updateReference(): void { this.fbService.updateReference(); }

  // Search results
  nextPage() {
    const current = this.paging();
    if (!current) return;

    if (current.to < current.total) {
      this.from.update(from => from + this.quantity());
    }
  }

  previousPage() {
    if (this.page() > 0) {
      this.from.update(from => from - this.quantity());
    }
  }

  onSearchChange(value: string) {
    this.from.set(0); // reset page when searching
    this.keyword.set(value);
  }

  manualRefresh() {
    this.refresh.update(v => v + 1);
  }

  // Modal
  hideModal() {
    UIkit.modal(document.getElementById('fb-modal-full')).hide();
  }
}
