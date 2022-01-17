import {Component, Input, OnChanges, OnInit, SimpleChanges} from "@angular/core";
import {SurveyAnswer} from "../../../app/domain/survey";
import {zip} from "rxjs/internal/observable/zip";
import {FormControlService} from "../../services/form-control.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Router} from "@angular/router";
import {
  ChapterModel,
  GroupedField,
  SurveyModel,
  Tabs,
  UiVocabulary
} from "../../domain/dynamic-form-model";
import BitSet from "bitset";

@Component({
  selector: 'app-survey',
  templateUrl: 'survey.component.html',
  providers: [FormControlService]
})

export class SurveyComponent implements OnInit, OnChanges {

  @Input() surveyAnswers: SurveyAnswer = null;
  @Input() tabsHeader : string = null;

  surveyModel: SurveyModel;
  chapters: ChapterModel[] = [];
  chapterChangeMap: Map<string,boolean> = new Map<string, boolean>();
  sortedSurveyAnswers: Object = {};
  currentChapter: ChapterModel = null;
  fields: GroupedField[] = null;
  vocabularies: Map<string, string[]>;
  subVocabularies: UiVocabulary[] = [];
  editMode = false;
  bitset: Tabs = new Tabs;

  ready = false;
  readonly : boolean = false;
  errorMessage = '';

  form: FormGroup;

  constructor(private formControlService: FormControlService,
              private fb: FormBuilder,
              private router: Router) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    if (this.router.url.includes('/view')) {
      this.readonly = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.surveyAnswers) {
      this.editMode = true;
      this.ready = false;
      zip(
        this.formControlService.getUiVocabularies(),
        this.formControlService.getFormModel(this.surveyAnswers.surveyId)
      ).subscribe(res => {
          this.vocabularies = res[0];
          this.surveyModel = res[1];
          // this.fields = res[1][Object.keys(res[1])[0]];
          res[1].chapterModels.sort((a, b) => a.chapter.order - b.chapter.order);
          for (const model of res[1].chapterModels) {
            for (const surveyAnswer in this.surveyAnswers.chapterAnswers) {
              if (model.chapter.id === this.surveyAnswers.chapterAnswers[surveyAnswer].chapterId) {
                this.chapters.push(model);
                this.chapterChangeMap.set(model.chapter.id, false);
                this.sortedSurveyAnswers[model.chapter.id] = this.surveyAnswers.chapterAnswers[surveyAnswer].answer;
                break;
              }
            }
          }
        },
        error => {
          this.errorMessage = 'Something went bad while getting the data for page initialization. ' + JSON.stringify(error.error.error);
        },
        () => {
          for (let i  = 0; i < this.chapters.length; i++) {
            this.form.addControl(this.chapters[i].chapter.name, this.formControlService.toFormGroup(this.chapters[i].groupedFieldsList, true)) ;
          }
          setTimeout(() => {
            if (this.readonly) {
              this.form.disable();
            }
          }, 0);
          this.ready = true;
        });
    }
  }

  getFormGroup(index: number): FormGroup {
    return this.form.get(this.chapters[index].chapter.name) as FormGroup;
  }

  setChapterChangesMap(chapterId: string) {
    this.chapterChangeMap.set(chapterId, true);
  }

}
