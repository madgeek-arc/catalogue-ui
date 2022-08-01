export class DocDefinition {
  header: Content;
  content: any[];
  styles: Object;
  images: Object;

  constructor() {
    this.header = new Content('', ['']);
    this.content = [];
    this.styles = {};
  }
}

export class Content {
  text: string;
  style: string[];
  width: string;

  constructor(text: string, style: string[]) {
    this.text = text;
    this.style = style;
  }
}

export class Columns {
  columns: any[];


  constructor() {
    this.columns = [];
  }
}

export class PdfImage {
  image: string;
  height: number;
  width: number;
  style: string[];

  constructor(image: string, height: number, width: number, style: string[]) {
    this.image = image;
    this.height = height;
    this.width = width;
    this.style = style;
  }
}
