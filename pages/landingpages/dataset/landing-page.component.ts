import {Component, OnDestroy, OnInit} from "@angular/core";
import {Subscriber} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {LandingPageService} from "../../../services/landing-page.service";
import {NavigationService} from "../../../../services/navigation.service";
import {UserService} from "../../../../services/user.service";
import {UserInfo} from "../../../../domain/userInfo";
import {environment} from "../../../../../environments/environment";


@Component({
  selector: 'app-dataset',
  templateUrl: 'dataset-landing-page.component.html',
  providers: [LandingPageService]
})

export class LandingPageComponent implements OnInit, OnDestroy {
  subscriptions = [];
  dataset: Object = null;
  instances: Object[] = null;
  userInfo: UserInfo = null;
  projectName: string = null;

  constructor(protected route: ActivatedRoute,
              protected navigationService: NavigationService,
              protected landingPageService: LandingPageService,
              protected router: Router,
              protected userService: UserService) {}

  ngOnInit() {
    this.projectName = environment.projectName;
    if (this.userService.userInfo !== null) {
      this.userInfo = this.userService.userInfo;
    } else {
      this.subscriptions.push(
        this.userService.getUserInfo().subscribe(
          res => {
            this.userInfo = res;
            this.userService.userInfo = res;
          },
          error => {
            console.log(error);
          }
        )
      );
    }


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
