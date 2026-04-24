import { Component, computed, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { debounceTime, distinctUntilChanged, switchMap, tap } from "rxjs/operators";
import { combineLatest } from "rxjs";
import { Paging } from "../../domain/paging";
import { Model } from "../../domain/dynamic-form-model";
import { DynamicCatalogueService } from "../../services/dynamic-catalogue.service";
import { FormBuilderService } from "../../services/form-builder.service";

@Component({
  imports: [
    DatePipe,
    RouterLink
  ],
  templateUrl: './forms-list.component.html'
})

export class FormsListComponent implements OnInit {
  private destroyRef = inject(DestroyRef)
  private catalogueService = inject(DynamicCatalogueService);
  protected fbService = inject(FormBuilderService);

  // State signals
  paging = signal<Paging<Model>>(null);
  from = signal(0);
  quantity = signal(10);
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

  // manualRefresh() {
  //   this.refresh.update(v => v + 1);
  // }

}
