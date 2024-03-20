import { Component, DestroyRef, inject } from "@angular/core";

@Component({
  template: ``
})

export class BaseFieldComponent {

  protected destroyRef = inject(DestroyRef);

}
