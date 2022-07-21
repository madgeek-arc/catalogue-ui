import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from "@angular/core";
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {zip} from "rxjs/internal/observable/zip";
import {SurveyAnswer} from "../../../app/domain/survey";
import {SurveyService} from "../../../app/services/survey.service";
import {FormControlService} from "../../services/form-control.service";
import {Section, Field, Model, Tabs, UiVocabulary} from "../../domain/dynamic-form-model";
import {Content, DocDefinition} from "../../domain/PDFclasses";
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
  printElementToPDF(elem: string)
  {
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
    docDefinition.header.style = 'sectionHeader'
    // docDefinition.content.push(new Content('Customer Details', ''));
    docDefinition.styles ={
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
      }
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
          docDefinition.content.push(new Content(field.label.text,''));
        this.createDocumentDefinition(abstractControl, docDefinition);
      } else if (abstractControl instanceof FormArray) {
        docDefinition.content.push(new Content(field.label.text,'marginTop'));
        for (let i = 0; i < abstractControl.controls.length; i++) {
          let control = group.controls[key].controls[i];
          if (control instanceof FormGroup || control instanceof FormArray) {
            this.createDocumentDefinition(control, docDefinition);
          } else {
            docDefinition.content.push(new Content(control.value,''));
          }
        }
      } else {
        docDefinition.content.push(new Content(field.label.text,'marginTop'));
        docDefinition.content.push(new Content(abstractControl.value,'marginTopSmall'));
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
