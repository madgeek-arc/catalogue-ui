import {AbstractControl, PatternValidator, ValidationErrors} from '@angular/forms';
import {Observable, timer} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {FormControlService} from '../../services/form-control.service';

export function URLValidator(control: AbstractControl) { //TODO Please validate me
  let val = new PatternValidator();
  val.pattern = /^(https?:\/\/.+){0,1}$/;
  return val.validate(control);
}

/** Increase time var to reduce server calls **/
export const urlAsyncValidator = (formControlService: FormControlService, time: number = 0) => {
  return (control: AbstractControl): Observable<ValidationErrors> => {
    if (control.value === '') {
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
