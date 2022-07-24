import {Component, OnInit} from "@angular/core";
import {SurveyComponent} from "../dynamic-form/survey.component";
import {FormControlService} from "../../services/form-control.service";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

@Component({
  selector: 'app-printPdf',
  templateUrl: 'printToPdf.component.html',
  providers: [FormControlService]
})

export class PrintToPdfComponent extends SurveyComponent implements OnInit {

  ngOnInit() {
    super.ngOnInit();
  }

  generatePDF2() {
    html2canvas(document.getElementById('top-navigation-tabs'), {
      allowTaint: true,
      useCORS: false,
      scale: 1
    }).then(function(canvas) {
      var img = canvas.toDataURL("image/png");
      var doc = new jsPDF();
      doc.addImage(img,'PNG',7, 20, 195, 105);
      doc.save('postres.pdf');
    });
  }
}
