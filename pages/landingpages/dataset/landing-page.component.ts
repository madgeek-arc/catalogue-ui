import {Component, OnDestroy, OnInit} from "@angular/core";
import {ActivatedRoute} from "@angular/router";
import {LandingPageService} from "../../../services/landing-page.service";
import {Subscriber} from "rxjs";


@Component({
  selector: 'app-dataset',
  templateUrl: 'dataset-landing-page.component.html',
  providers: [LandingPageService]
})

export class LandingPageComponent implements OnInit, OnDestroy {
  subscriptions = [];
  dataset: Object = null;
  instances: Object[] = null;

  constructor(protected route: ActivatedRoute,
              protected landingPageService: LandingPageService) {}

  ngOnInit() {
    this.subscriptions.push(
      this.route.params.subscribe(params => {
        this.subscriptions.push(
          this.landingPageService.getDataset(params['id']).subscribe(
            res => {
              this.dataset = res;
              // console.log(this.dataset);
              this.subscriptions.push(
                this.landingPageService.searchDatasetInstance('dataset_instance', this.dataset['name']).subscribe(
                  res => {
                    this.instances = res['results'];
                  }
                )
              );
            }
          )
        );
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      if (subscription instanceof Subscriber) {
        subscription.unsubscribe();
      }
    });
  }

}
