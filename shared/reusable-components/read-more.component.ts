/**
 * Created by stefania on 4/6/17.
 */
import { AfterContentInit, AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild, ChangeDetectionStrategy, signal } from "@angular/core";

@Component({
    selector: 'read-more',
    template: `
    <div [class.collapsed]="isCollapsed()" [style.height]="isCollapsed() ? maxHeight+'px' : 'auto'" #readMoreDiv>
      <ng-content></ng-content>
    </div>
    @if (isCollapsable()) {
      <a (click)="isCollapsed.set(!isCollapsed())">View {{isCollapsed() ? 'more' : 'less'}}...</a>
    }
    `,
    styles: [`div.collapsed {overflow: hidden;}`],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ReadMoreComponent implements AfterContentInit {
  //the text that need to be put in the container
  //@Input() text: string;
  //maximum height of the container
  @Input("maxHeight") maxHeight: number = 100;
  @ViewChild("readMoreDiv", {static: true}) readMoreDiv: ElementRef | undefined;
  //set these to false in order to get the height of the expended container
  // set from a timeout after the content is measured, so they are signals for the OnPush view to refresh
  public isCollapsed = signal(false);
  public isCollapsable = signal(false);

  constructor(public elementRef: ElementRef) {}

  ngAfterContentInit() {
    setTimeout((_: any) => {
      let currentHeight = this.readMoreDiv?.nativeElement.offsetHeight;
      //collapsable only if the contents make the container exceed the max height
      if (currentHeight > this.maxHeight || currentHeight === 0) {
        this.isCollapsed.set(true);
        this.isCollapsable.set(true);
      } else {}
    }, 200);
  }
}

@Component({
    selector: 'read-more-text',
    template: `
    <div [innerHTML]="text" [class.collapsed]="isCollapsed()" [style.height]="isCollapsed() ? maxHeight+'px' : 'auto'" #readMoreDiv>
      <!--{{text}}-->
    </div>
    @if (isCollapsable()) {
      <a (click)="isCollapsed.set(!isCollapsed())">View {{isCollapsed() ? 'more' : 'less'}}...</a>
    }
    `,
    styles: [`div.collapsed {overflow: hidden;}`],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class ReadMoreTextComponent extends ReadMoreComponent implements OnChanges, AfterViewInit {

  @Input() text: string = "";

  ngAfterViewInit(): void {
    this.ngAfterContentInit();
  }

  ngOnChanges(): void {
    this.ngAfterContentInit();
  }
}
