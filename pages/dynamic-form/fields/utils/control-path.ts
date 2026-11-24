import { AbstractControl, FormArray } from "@angular/forms";

/** Dot-separated path of a control from the form root, with array positions written as `[i]`, e.g. `section.items.[2]`. */
export function controlPath(control: AbstractControl): string {
  const path: string[] = [];
  let current: AbstractControl = control;
  while (current.parent) {
    const parent = current.parent;
    if (parent instanceof FormArray) {
      path.unshift(`[${parent.controls.indexOf(current)}]`);
    } else {
      path.unshift(Object.keys(parent.controls).find(key => parent.controls[key] === current));
    }
    current = parent;
  }
  return path.join('.');
}
