import {Component, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {LandingPageService} from "../../../services/landing-page.service";

@Component({
  selector: 'app-dataset',
  templateUrl: 'dataset-landing-page.component.ts.html',
  providers: [LandingPageService]
})

export class LandingPageComponent implements OnInit {
  private sub: Subscription;
  dataset: Object = null;

  constructor(protected route: ActivatedRoute, protected landingPageService: LandingPageService) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.landingPageService.getDataset(params['id']).subscribe(
        res => {
          this.dataset = res;
          console.log(this.dataset);
        }
      );
    });
  }
}
