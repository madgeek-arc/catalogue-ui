import {AbstractControl, PatternValidator, ValidationErrors, ValidatorFn} from '@angular/forms';
import {Observable, timer} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {FormControlService} from '../../services/form-control.service';

export function URLValidator(): ValidatorFn { //TODO Please validate me
  return (control: AbstractControl): ValidationErrors | null => {
    let pattern = /^(https?:\/\/.+){0,1}$/;
    const url = pattern.test(control.value);
    console.log(url);
    return url ? {url: {value: control.value}} : null;
  };
}

/** Increase time var to reduce server calls **/
export const urlAsyncValidator = (formControlService: FormControlService, time: number = 0) => {
  return (control: AbstractControl): Observable<ValidationErrors> => {
    if (control.value === '' || control.value === null) {
      return timer(time).pipe(map(res => {
        return new Observable<ValidationErrors>();
        })
      );
    }
    return timer(time).pipe(
      switchMap(() => formControlService.validateUrl(control.value)),
      map(res => {
        return res ? new Observable<ValidationErrors>() : {invalidAsync: true};
      })
    );
  };
};
