import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const urlRegEx = /^(https?:\/\/.+){0,1}$/;   // http// or https//
export const phoneRegEx = /^[+]?[0-9\s()-]{7,20}$/; // just reasonable phone input, not perfect validation.
export const emailRegEx = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;  // email validation

export function URLValidator(): ValidatorFn { //TODO Please validate me
  return (control: AbstractControl): ValidationErrors | null => {
    let pattern = /^(https?:\/\/.+){0,1}$/;
    const url = pattern.test(control.value);
    return url ? {url: {value: control.value}} : null;
  };
}

/** Increase time var to reduce server calls **/
// export const urlAsyncValidator = (formControlService: FormControlService, time: number = 0) => {
//   return (control: AbstractControl): Observable<ValidationErrors> => {
//     if (control.value === '' || control.value === null) {
//       return timer(time).pipe(map(res => {
//         return new Observable<ValidationErrors>();
//         })
//       );
//     }
//     return timer(time).pipe(
//       switchMap(() => formControlService.validateUrl(control.value)),
//       map(res => {
//         return res ? new Observable<ValidationErrors>() : {invalidAsync: true};
//       })
//     );
//   };
// };
