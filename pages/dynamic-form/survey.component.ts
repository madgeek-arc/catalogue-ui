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

  @Input() surveyAnswers: SurveyAnswer[] = [];
  @Input() tabsHeader : string = null;

  surveyModel: SurveyModel;
  chapters: ChapterModel[] = [];
  chapterChangeMap: Map<string,boolean> = new Map<string, boolean>();
  sortedSurveyAnswers: SurveyAnswer[] = [];
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
        this.formControlService.getFormModel(this.surveyAnswers[0].surveyId)
      ).subscribe(res => {
          this.vocabularies = res[0];
          this.surveyModel = res[1];
          // this.fields = res[1][Object.keys(res[1])[0]];
          res[1].chapterModels.sort((a, b) => a.chapter.order - b.chapter.order);
          for (const model of res[1].chapterModels) {
            this.chapters.push(model);
            this.chapterChangeMap.set(model.chapter.id, false);
          }
        },
        error => {
          this.errorMessage = 'Something went bad while getting the data for page initialization. ' + JSON.stringify(error.error.error);
        },
        () => {
          // this.chapters.sort((a, b) => a.chapter.order - b.chapter.order);
          for (const chapter of this.chapters) {
            for (const surveyAnswer of this.surveyAnswers) {
              if (chapter.chapter.id === surveyAnswer.chapterId) {
                this.sortedSurveyAnswers.push(surveyAnswer);
                break;
              }
            }
          }
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
