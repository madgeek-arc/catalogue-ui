export class DocDefinition {
  header: Content;
  content: Content[];
  styles: Object;


  constructor() {
    this.header = new Content('', '');
    this.content = [];
    this.styles = {};
  }
}

export class Content {
  text: string;
  style: string;


  constructor(text: string, style: string) {
    this.text = text;
    this.style = style;
  }
}
