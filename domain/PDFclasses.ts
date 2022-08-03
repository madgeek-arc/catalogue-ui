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

export class PdfSvg {
  svg: string
  height: number;
  width: number;
  style: string[];

  constructor(svg: string, height: number, width: number, style: string[]) {
    this.svg = svg;
    this.height = height;
    this.width = width;
    this.style = style;
  }
}

export class PdfTable {
  table: TableDefinition;
  styles: string[]

  constructor(table: TableDefinition, styles: string[]) {
    this.table = table;
    this.styles = styles;
  }
}

export class TableDefinition {
  body: string[][];
  widths: string[];
  heights: number[];

  constructor(body: string[][], widths: string[], heights?: number[]) {
    this.body = body;
    this.widths = widths;
    if (heights)
      this.heights = heights;
  }
}
