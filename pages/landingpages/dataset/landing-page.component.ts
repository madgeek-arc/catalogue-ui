import {Component, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {LandingPageService} from "../../../services/landing-page.service";
import {NavigationService} from "../../../../app/services/navigation.service";

@Component({
  selector: 'app-dataset',
  templateUrl: 'dataset-landing-page.component.ts.html',
  providers: [LandingPageService]
})

export class LandingPageComponent implements OnInit {
  private sub: Subscription;
  dataset: Object = null;
  instances: Object[] = null;

  constructor(protected route: ActivatedRoute,
              protected navigationService: NavigationService,
              protected landingPageService: LandingPageService,
              protected router: Router) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.landingPageService.getDataset(params['id']).subscribe(
        res => {
          this.dataset = res;
          console.log(this.dataset);
          this.landingPageService.searchDatasetInstance('dataset_instance', this.dataset['name']).subscribe(
            res => {
              this.instances = res['results'];
            }
          )
        }
      );
    });
  }
}
