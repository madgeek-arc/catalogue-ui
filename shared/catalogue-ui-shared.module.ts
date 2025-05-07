import { NgModule } from "@angular/core";
import { UniquePipe } from "./pipes/uniquePipe.pipe";
import { SortableDirective } from "./directives/sortable.directive";

@NgModule({
  declarations: [
    UniquePipe,
    SortableDirective
  ],
  imports: [],
  exports: [
    UniquePipe,
    SortableDirective
  ]
})

export class CatalogueUiSharedModule { }
