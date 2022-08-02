import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from "@angular/core";
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {zip} from "rxjs/internal/observable/zip";
import {SurveyAnswer} from "../../../app/domain/survey";
import {SurveyService} from "../../../app/services/survey.service";
import {FormControlService} from "../../services/form-control.service";
import {Section, Field, Model, Tabs, UiVocabulary} from "../../domain/dynamic-form-model";
import {Columns, Content, DocDefinition, PdfImage} from "../../domain/PDFclasses";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { jsPDF } from "jspdf";
import BitSet from "bitset";

pdfMake.vfs = pdfFonts.pdfMake.vfs;
import UIkit from "uikit";

@Component({
  selector: 'app-survey',
  templateUrl: 'survey.component.html',
  providers: [FormControlService]
})

export class SurveyComponent implements OnInit, OnChanges {

  @Input() answer: SurveyAnswer = null;
  @Input() survey: Model = null;
  @Input() tabsHeader : string = null;

  @ViewChild('printPDF', { static: false }) el!: ElementRef;

  sectionIndex = 0;
  chapterChangeMap: Map<string,boolean> = new Map<string, boolean>();
  currentChapter: Section = null;
  chapterForSubmission: Section = null;
  sortedSurveyAnswers: Object = {};
  vocabularies: Map<string, string[]>;
  subVocabularies: UiVocabulary[] = [];
  editMode = false;
  bitset: Tabs = new Tabs;

  ready = false;
  readonly : boolean = false;
  validate : boolean = false;
  errorMessage = '';
  successMessage = '';

  form: FormGroup;

  constructor(private formControlService: FormControlService, private fb: FormBuilder,
              private router: Router, private surveyService: SurveyService,
              private route: ActivatedRoute) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    if (this.router.url.includes('/view')) {
      this.readonly = true;
    } else if (this.router.url.includes('/validate')) {
      this.validate = true;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.ready = false;
    this.currentChapter = this.survey.sections[0];
    if (this.answer)
      this.editMode = true;
    if (this.survey) {
      this.formControlService.getUiVocabularies().subscribe(res => {
        this.vocabularies = res;
        // res[1].sections.sort((a, b) => a.order - b.order);
        this.survey.sections = this.survey.sections.sort((a, b) => a.order - b.order);
        // this.chapters = [];
        for (const section of this.survey.sections) {
          for (const surveyAnswer in this.answer.answer) {
            if (section.id === this.answer.answer[surveyAnswer].chapterId) {
              // this.chapters.push(section);
              this.chapterChangeMap.set(section.id, false);
              this.sortedSurveyAnswers[section.id] = this.answer.answer[surveyAnswer].answer;
              break;
            }
          }
        }
      },
      error => {
        this.errorMessage = 'Something went bad while getting the data for page initialization. ' + JSON.stringify(error.error.error);
      },
      () => {
        for (let i = 0; i < this.survey.sections.length; i++) {
          this.form.addControl(this.survey.sections[i].name, this.formControlService.toFormGroup(this.survey.sections[i].subSections, true));
          // this.form = this.formControlService.toFormGroup(this.survey.sections[i].subSections, true);
          // this.prepareForm(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]], this.survey.sections[i].subSections)
          this.prepareForm(this.answer.answer, this.survey.sections[i].subSections)
          // this.form.get(this.survey.sections[i].name).patchValue(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]]);
          this.form.patchValue(this.answer.answer);
        }
        if (this.answer.validated) {
          this.readonly = true;
          this.validate = false;
        } else if (this.validate) {
          UIkit.modal('#validation-modal').show();
        }

        setTimeout(() => {
          if (this.readonly) {
            this.form.disable();
          }
        }, 0);
        this.ready = true;
      });
    }
    else { // TODO: remove later
      this.route.params.subscribe(
        params => {
          zip(
            this.formControlService.getUiVocabularies(),
            this.formControlService.getFormModelByType(params['resourceTypeModel'])
          ).subscribe(
            res => {
              this.vocabularies = res[0];
              this.survey = res[1].results[0];
            },
            error => {console.log(error)},
            () => {
              for (let i = 0; i < this.survey.sections.length; i++) {
                if (this.survey.sections[i].subSections)
                  this.form.addControl(this.survey.sections[i].name, this.formControlService.toFormGroup(this.survey.sections[i].subSections, true));
                else {
                  this.form.addControl(this.survey.name, this.formControlService.toFormGroup(this.survey.sections, true));
                }
                // this.prepareForm(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]], this.surveyModel.sections[i].subSections)
                // this.form.get(this.surveyModel.sections[i].name).patchValue(this.sortedSurveyAnswers[Object.keys(this.sortedSurveyAnswers)[i]]);
              }
              // if (this.surveyAnswers.validated) {
              //   this.readonly = true;
              //   this.validate = false;
              // } else if (this.validate) {
              //   UIkit.modal('#validation-modal').show();
              // }

              // setTimeout(() => {
              //   if (this.readonly) {
              //     this.form.disable();
              //   }
              // }, 0);
              this.ready = true
            }
          );
        }
      );
    }
  }

  validateSurvey() {
    for (const chapterChangeMapElement of this.chapterChangeMap) {
      if (chapterChangeMapElement[1]) {
        UIkit.modal('#validation-modal').hide();
        this.errorMessage = 'There are unsaved changes, please submit all changes first and then validate.';
        return;
      }
    }
    if (this.form.valid) {
      this.surveyService.changeAnswerValidStatus(this.answer.id, !this.answer.validated).subscribe(
        next => {
          UIkit.modal('#validation-modal').hide();
          this.router.navigate(['/contributions/mySurveys']);
        },
        error => {
          console.error(error);
        },
        () => {});
    } else {
      UIkit.modal('#validation-modal').hide();
      console.log('Invalid form');
      this.form.markAllAsTouched();
      let str = '';
      for (let key in this.form.value) {
        // console.log(this.form.get('extras.'+key));
        console.log(key + ': '+ this.form.get(key).valid);
        if (!this.form.get(key).valid) {
          str =  str + '\n\t-> ' + key;
        }
        for (const keyElement in this.form.get(key).value) {
          console.log(keyElement + ': '+ this.form.get(key+'.'+keyElement).valid);
        }
      }
      this.errorMessage = 'There are missing fields at chapters ' + str;
    }
  }

  onSubmit(e: any) {
    window.scrollTo(0, 0);
    // this.showLoader = true;
    // this.formControlService.postItem(this.surveyAnswers.id, this.form.get(this.chapterForSubmission.name).value, this.editMode).subscribe(
    this.formControlService.postItem(this.answer.id, this.form.getRawValue(), this.editMode).subscribe(
      res => {
        this.successMessage = 'Updated successfully!';
        for (const key of this.chapterChangeMap.keys()) {
          this.chapterChangeMap.set(key, false);
        }
        UIkit.modal('#unsaved-changes-modal').hide();
      },
      error => {
        this.errorMessage = 'Something went bad, server responded: ' + JSON.stringify(error?.error?.error);
        // this.showLoader = false;
        UIkit.modal('#unsaved-changes-modal').hide();
        console.log(error);
      },
      () => {
        setTimeout(() => {
          UIkit.alert('#successMessage').close();
        }, 4000);
        setTimeout(() => {
          this.successMessage = '';
        }, 4200);
        // this.showLoader = false;
      }
    );
  }

  showUnsavedChangesPrompt(chapter: Section) {
    if (this.chapterChangeMap.get(this.currentChapter.id)) {
      this.chapterForSubmission = this.currentChapter;
      UIkit.modal('#unsaved-changes-modal').show();
    }
    this.currentChapter = chapter;
  }

  getFormGroup(sectionIndex: number): FormGroup {
    if (this.survey.sections[sectionIndex].subSections === null) {
      return this.form.get(this.survey.name) as FormGroup;
    } else
      // console.log(this.form.get(this.survey.sections[sectionIndex].name));
      return this.form.get(this.survey.sections[sectionIndex].name) as FormGroup;
  }

  setChapterChangesMap(chapterId: string[]) {
    if (chapterId[1] === null) {
      this.chapterChangeMap.set(chapterId[0], true);
    } else {
      this.chapterChangeMap.set(chapterId[0], false);
    }
  }

  /** create additional fields for arrays if needed --> **/
  prepareForm(answer: Object, fields: Section[]) {
    for (const [key, value] of Object.entries(answer)) {
      // console.log(`${key}: ${value}`);
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        this.prepareForm(value, fields);
      } else if (Array.isArray(value)) {
        let i = 1;
        if (value?.length > 1)
          this.pushToFormArray(key, value?.length);
        for ( ;i < value?.length; i++) {
          if (typeof value[i] === 'object' && !Array.isArray(value[i]) && value !== null) {
            this.prepareForm(value[i], fields);
          }
          // Maybe a check for array in array should be here
        }
      } else if (value === null) {
        // console.log(key+ ' is null');
      }
    }
  }

  pushToFormArray(name: string, length: number) {
    let field = this.getModelData(this.survey.sections, name);
    for (let i = 0; i < length-1; i++) {
      this.getFormControl(this.form, name).push(this.formControlService.createField(field));
    }
  }

  getModelData(model: Section[], name: string): Field {
    let field = null;
    for (let i = 0; i < model.length; i++) {
      if (model[i].fields === null) {
        field = this.getModelData(model[i].subSections, name);
        if (field) {
          return field;
        }
      } else {
        field = this.searchSubFields(model[i].fields, name);
        if (field) {
          return field;
        }
      }
    }
    return field;
  }

  searchSubFields(fields: Field[], name): Field | null {
    let field = null;
    for (let j = 0; j < fields.length; j++) {
      if(fields[j].name === name) {
        return fields[j];
      } else if (fields[j].subFields?.length > 0) {
        field = this.searchSubFields(fields[j].subFields, name);
        if (field?.name === name)
          return field;
      }
    }
    return null;
  }

  getFormControl(group: FormGroup | FormArray, name: string): FormArray {
    let abstractControl = null;
    for (const key in group.controls) {
      abstractControl = group.controls[key];
      if (abstractControl instanceof FormGroup || abstractControl instanceof FormArray) {
        if (key !== name) {
          abstractControl = this.getFormControl(abstractControl, name);
        }
        break;
      } else if (key === name)
          break;
    }
    return abstractControl;
  }
  /** <-- create additional fields for arrays if needed **/

  /** Generate PDF --> **/
  printElementToPDF(elem: string) {
    let mywindow = window.open('', 'PRINT', 'height=400,width=600');

    // mywindow.document.write('<html lang="en"><head><link rel="stylesheet" type="text/css" href="../../../styles/styles.scss" /><title>' + document.title  + '</title>');
    // mywindow.document.write('</head><body>');
    // mywindow.document.write('<h1>' + document.title  + '</h1>');
    // mywindow.document.write(document.getElementById(elem).innerHTML);
    // mywindow.document.write('</body></html>');
    // //
    // mywindow.document.close(); // necessary for IE >= 10
    // mywindow.focus(); // necessary for IE >= 10*/
    //
    // mywindow.print();
    // mywindow.close();
    window.print();

    return true;
  }

  jsPDF() {
    let doc = new jsPDF();

    // doc.html(`<html><head><title>Test</title></head><body>` + document.getElementById('top-navigation-tabs').innerHTML + `</body></html>`);
    // doc.save('div.pdf');
    let pdf = new jsPDF()
    pdf.html(this.el.nativeElement.innerHTML, {
      callback: (pdf) => {
        pdf.save("sample.pdf")
      }
    })
  }

  generatePDF() {
    let docDefinition: DocDefinition = new DocDefinition();
    docDefinition.header.text = 'Header Text'
    docDefinition.header.style = ['sectionHeader']
    // docDefinition.content.push(new Content('Customer Details', ''));
    docDefinition.styles = {
      sectionHeader: {
        bold: true,
        alignment: 'center',
        decoration: 'underline',
        color: 'skyblue',
        fontSize: 18,
        margin: [0, 15, 0, 15]
      },
      marginTop: {
        margin: [0, 8, 0, 0]
      },
      marginTopSmall: {
        margin: [0, 2, 0, 0]
      },
      marginLeftSmall: {
        margin: [3, 0, 0, 0]
      },
      marginTopCheckBox: {
        margin: [0, 3, 0, 0]
      }
    }
    docDefinition.images = {
      checked: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAQAAACROWYpAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF+2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMTItMzBUMDE6Mzc6MjArMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTEyLTMwVDAxOjM4OjI4KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTEyLTMwVDAxOjM4OjI4KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMSIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IkRvdCBHYWluIDIwJSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowNzVjYjZmMy1jNGIxLTRiZjctYWMyOS03YzUxMWY5MWJjYzQiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo5ZTM1YTc3ZC0zNDM0LTI5NGQtYmEwOC1iY2I5MjYyMjBiOGIiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowYzc2MDY3Ny0xNDcwLTRlZDUtOGU4ZS1kNTdjODJlZDk1Y2UiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjBjNzYwNjc3LTE0NzAtNGVkNS04ZThlLWQ1N2M4MmVkOTVjZSIgc3RFdnQ6d2hlbj0iMjAxOS0xMi0zMFQwMTozNzoyMCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA3NWNiNmYzLWM0YjEtNGJmNy1hYzI5LTdjNTExZjkxYmNjNCIgc3RFdnQ6d2hlbj0iMjAxOS0xMi0zMFQwMTozODoyOCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+jHsR7AAAAUNJREFUOMvN1T9Lw0AYx/EviLVFxFH8M3USgyAFoUsQ0UV8F6Ui4qCTbuJg34HgptBdUATrUoxiqYMgiOBoIcW9BVED+jgkntGm9i6CmN+Sg/vAcc89dwBd5Clzj6uZGg7LJAC62UFipEgKcmroaeZj/gpcIAhl5rE1M0cJQbiCOsIrs5h8WZ4R6j72yBrhcRo+dhE8bCOcoYng/hFOMxAXb/DAHTNxcCGo7JE5LqhjsW2KP6nDcGecCv1vRdC2eJQDLllooach2hbvIghvLJJgM0QHdeq8F0x/5ETRM4b0DonF7be+Pf+y4A4bZnETok4E/XG3xxR3WhasUWeLCg2OGYnXGP1MkPwnLRmJf3UN+RfgtBGe5MnHVQShxBQZzdgcIgjXsKSu/KZmXgKxBkmKsZ6bffoAelilQs3goauyTi+8A8mhgeQlxdNWAAAAAElFTkSuQmCC',
      unchecked: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAQAAACROWYpAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAF+2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMTItMzBUMDE6Mzc6MjArMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTEyLTMwVDAxOjM4OjU3KzAxOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTEyLTMwVDAxOjM4OjU3KzAxOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMSIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IkRvdCBHYWluIDIwJSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpjMGUyMmJhZC1lY2VkLTQzZWUtYjIzZC1jNDZjOTNiM2UzNWMiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo5M2FhOTEzYy1hZDVmLWZmNGEtOWE5Ny1kMmUwZjdmYzFlYmUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDozYmY2ODFlMy1hMTRhLTQyODMtOGIxNi0zNjQ4M2E2YmZlNjYiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjNiZjY4MWUzLWExNGEtNDI4My04YjE2LTM2NDgzYTZiZmU2NiIgc3RFdnQ6d2hlbj0iMjAxOS0xMi0zMFQwMTozNzoyMCswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmMwZTIyYmFkLWVjZWQtNDNlZS1iMjNkLWM0NmM5M2IzZTM1YyIgc3RFdnQ6d2hlbj0iMjAxOS0xMi0zMFQwMTozODo1NyswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+6AB6cQAAAPxJREFUOMvF1b1Kw1AYBuAnFf8QL8WlIHQJIriIdyEu4qCTXop7dwenTgUHpYvgJVhob8AuakE+h9hapJqcFDXvFDgPIXlzvgNLjnQ9GlRM340TK7DsUtRI2zqH09txxUzWn3IrhK4DecXs6wjhnqHwZk/K1fIiDAs81krCW54KPBDG8iTcNBIGf4ND1MWTdmrgqIOL5TM0S8SRhmMu1dAo+2DZ57t9eWajtKrvN1GVnrMK9HewhbBy+nPPJbTsJwmymOn8P7fkfLzQGCoG4G4S3vZc4J4QOnY0KyZ3LYQHjqcjf1Qxrx/inDXtWsfNlU1YdeZOP+Gg67mwwTvIDqR1iAowgQAAAABJRU5ErkJggg==',
    }
    this.createDocumentDefinition(this.form, docDefinition);

    pdfMake.createPdf(docDefinition).open();
  }

  createDocumentDefinition(group: FormGroup | FormArray, docDefinition: DocDefinition) {
    for (const key in group.controls) {
      let abstractControl = group.controls[key];
      let field = this.getModelData(this.survey.sections, key);
      if (abstractControl instanceof FormGroup) {
        if (field)
          docDefinition.content.push(new Content(field.label.text,['']));
        this.createDocumentDefinition(abstractControl, docDefinition);
      } else if (abstractControl instanceof FormArray) {
        docDefinition.content.push(new Content(field.label.text,['marginTop']));
        for (let i = 0; i < abstractControl.controls.length; i++) {
          let control = group.controls[key].controls[i];
          if (control instanceof FormGroup || control instanceof FormArray) {
            this.createDocumentDefinition(control, docDefinition);
          } else {
            docDefinition.content.push(new Content(control.value,['']));
          }
        }
      } else {
        let field = this.getModelData(this.survey.sections, key);

        docDefinition.content.push(new Content(field.label.text,['marginTop']));
        if (field.typeInfo.type === 'radio'){
          // console.log(field.label.text);
          // console.log(field.typeInfo.values);
          // console.log(key);
          let values = field.typeInfo.values
          if (field.kind === 'conceal-reveal')
            values = this.getModelData(this.survey.sections, field.parent).typeInfo.values;
          for (const value of values) {
            let content = new Columns();
            if (value === abstractControl.value){
              content.columns.push(new PdfImage('checked', 10, 10, ['marginTopCheckBox']));
            }
            else {
              content.columns.push(new PdfImage('unchecked', 10, 10, ['marginTopCheckBox']));
            }
            content.columns.push(new Content(value,['marginLeftSmall', 'marginTopSmall']));
            docDefinition.content.push(content);
          }
        } else {
          docDefinition.content.push(new Content(abstractControl.value,['marginTopSmall']));
        }
      }

    }
  }

  /** <-- Generate PDF **/

  /** other stuff --> **/
  closeAlert() {
    this.errorMessage = '';
    UIkit.alert('#errorAlert').close();
  }

  trackByMethod(index:number) {
    this.sectionIndex = index;
  }
}
