import {NgModule} from "@angular/core";
import {PremiumSortFacetsPipe, PremiumSortFacetValuesPipe, PremiumSortPipe} from "./pipes/premium-sort.pipe";
import {SafeUrlPipe} from "./pipes/safeUrlPipe";

@NgModule({
  declarations: [
    PremiumSortPipe,
    PremiumSortFacetsPipe,
    PremiumSortFacetValuesPipe,
    SafeUrlPipe
  ],
  imports: [],
  exports: [
    PremiumSortPipe,
    PremiumSortFacetsPipe,
    PremiumSortFacetValuesPipe,
    SafeUrlPipe
  ]
})

export class SharedModule { }
