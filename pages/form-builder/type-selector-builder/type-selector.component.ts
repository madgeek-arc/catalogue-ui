import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import {TypeInfo} from "../../../domain/dynamic-form-model";


@Component({
  selector: 'app-type-selector',
  templateUrl: 'type-selector.component.html'
})

export class TypeSelectorComponent implements OnChanges{

  @Input() typeInfo: TypeInfo;
  @Input() type: string;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    if (this.type === 'radio') {
      this.typeInfo.values.push('Option 1');
      this.cdr.detectChanges();
    }
  }

  ngOnChanges(changes:SimpleChanges) {
    this.typeInfo.values = [];
    if (this.type === 'radio') {
      // this.typeInfo.values.push('Option 1');
    }
    this.cdr.detectChanges();
  }

  addOption() {
    this.typeInfo.values.push('Option '+ (this.typeInfo.values.length+1));
  }

  remove(position) {
    this.typeInfo.values.splice(position, 1);
  }

  trackBy(index, item) {
    return index;
  }

}
