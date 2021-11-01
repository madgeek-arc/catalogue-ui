import {NgModule} from "@angular/core";
import {PremiumSortFacetsPipe, PremiumSortFacetValuesPipe, PremiumSortPipe} from "./pipes/premium-sort.pipe";

@NgModule({
  declarations: [
    PremiumSortPipe,
    PremiumSortFacetsPipe,
    PremiumSortFacetValuesPipe
  ],
  imports: [],
  exports: [
    PremiumSortPipe,
    PremiumSortFacetsPipe,
    PremiumSortFacetValuesPipe
  ]
})

export class SharedModule { }
