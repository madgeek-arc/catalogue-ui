import BitSet from 'bitset';
import jp from 'jsonpath';
import { Utils } from "../shared/utils/utils";

export class Required {
  topLevel: number;
  total: number;

  constructor() {
    this.topLevel = 0;
    this.total = 0;
  }
}

export class Dependent {
  id: number;
  name: string;
  value: string;
}

export class TypeInfo<T extends keyof FieldTypePropertiesMap = FieldType.string> {
  vocabulary: string;
  type: FieldType;
  defaultValue: string;
  values: IdLabel[];
  properties: FieldTypePropertiesMap[T];
  multiplicity: boolean;
  prefill: DataRequest;

  constructor(type: FieldType = FieldType.string) {
    this.type = type;
    this.values = [];
    this.vocabulary = null;
    this.multiplicity = false;
    this.properties = this.createDefaultProperties(type);
  }

  private createDefaultProperties(type: FieldType): TypeProperties {
    const PropertyClass = propertiesFactory[type];
    return new PropertyClass();
  }
}

export class Form {
  dependsOn: Dependent;
  group: string;
  description: StyledText;
  suggestion: StyledText;
  placeholder: string;
  mandatory: boolean;
  immutable: boolean;
  display: Display;

  constructor() {
    this.dependsOn = null;
    this.group = '';
    this.description = new StyledText();
    this.suggestion = new StyledText();
    this.placeholder = '';
    this.mandatory = false;
    this.immutable = false;
    this.display = new Display();
  }
}

export class Display {
  order: number;
  visible: boolean;
  hasBorder: boolean;
  cssClasses: string | null;
  style: string | null;
  placement: string | null;

  constructor() {
    this.hasBorder = false;
    this.order = 0;
    this.placement = null;
    this.cssClasses = null;
    this.style = null;
    this.visible = true;
  }
}

export class StyledText {
  cssClasses: string | null;
  style: string | null;
  text: string | null;
  showLess: boolean;

  constructor() {
    this.cssClasses = null;
    this.style = null;
    this.text = null;
    this.showLess = false;
  }
}

export class Field<T extends FieldType = FieldType.string> {
  id: string;
  name: string;
  parentId: string;
  parent: string;
  label: StyledText;
  accessPath: string;
  deprecated: boolean;
  kind: string;
  typeInfo: TypeInfo;
  includedInSnippet: boolean;
  form: Form;
  display: Display;
  subFields: Field[];

  constructor(id: string, type?: FieldType) {
    this.id = id;
    this.name = '';
    this.parentId = '';
    this.parent = '';
    this.label = new StyledText();
    this.accessPath = '';
    this.deprecated = false;
    this.typeInfo = new TypeInfo(type)
    this.includedInSnippet = false;
    this.form = new Form();
    this.display = new Display();
    this.subFields = [];
  }
}

export class Section {
  id: string | null;
  name: string  | null;
  description: string | null;
  subType: string | null;
  order: number;
  subSections: Section[] | null;
  fields: Field[] | null;
  required: Required;

  constructor(id: string) {
    this.id = id;
    this.name = null;
    this.description = null;
    this.subSections = null;
    this.fields = null;
    this.order = 0;
  }
}

export class SelectedSection {
  chapter: Section | null = null;
  section: Section | null = null;
  field: Field | null = null;
  sideMenuSettingsType: 'main' | 'chapter' | 'section' | 'field' | 'fieldSelector' = 'main';
}

// export class GroupedFields {
//   id: string;
//   name: string;
//   description: string;
//   order: number;
//   fields: Field[];
//   required: Required;
//
//
//   constructor() {
//     this.id = '';
//     this.name = '';
//     this.description = '';
//     this.order = 0;
//     this.fields = [];
//     this.required = new Required();
//   }
// }

export class Model {
  id: string;
  name: string | null;
  description: string | null;
  notice: string | null;
  type: string;
  subType: string;
  series: Series;
  resourceType: string;
  creationDate: string;
  createdBy: string;
  modificationDate: Date;
  modifiedBy: string;
  sections: Section[];
  configuration: Configuration;
  locked: boolean;
  active: boolean;


  constructor() {
    this.id = '1';
    this.name = null;
    this.description = null;
    this.notice = null;
    this.sections = [];
    this.configuration = new Configuration();
    this.locked = false;
    this.active = false;
  }

}

export class Configuration {
  prefillable: boolean;
  importFrom: string[]
}

export interface ImportSurveyData {
  importFrom: string[],
  importFromNames: string[];
  surveyAnswerId: string;
  surveyId: string;
}

export class UiVocabulary {
  id: string;
  name: string;
}

export class Tab {
  valid: boolean;
  order: number;
  requiredOnTab: number;
  remainingOnTab: number;
  bitSet: BitSet;

  constructor() {
    this.valid = false;
    this.order = 0;
    this.requiredOnTab = 0;
    this.remainingOnTab = 0;
  }

}

export class Tabs {
  tabs: Map<string, Tab>;
  requiredTabs: number;
  completedTabs: number;
  completedTabsBitSet: BitSet;
  requiredTotal: number;
}

export class HandleBitSet {
  field: Field;
  position: number;
}

export class IdLabel {
  id: string;
  label: string;
}

export class DataRequest {
  request: Request;
  endpoint: string;
  params: { [index: string]: any };
  contentType: string;
  expression: string;
}

export class Request {
  method: string;
  url: string;
  headers: { [index: string]: string[] };
  body: string;
}

export class RequiredFields {
  topLevel: number;
  total: number;
}

export class Series {
  name: string;
  referenceYear: string;
}

export class TypeProperties {
}

export class CustomProperties extends TypeProperties {
 [key: string]: string;
}

export class DateProperties extends TypeProperties {
  formatToString: boolean | null = null;
}

export class NumberProperties extends TypeProperties {
  min: number | null = null;
  max: number | null = null;
  decimals: number | null = null;
  pattern: string | null = null;
}

export class PatternProperties extends TypeProperties {
  pattern: string | null = null;
}

export class TextProperties extends TypeProperties {
  minLength: number | null = null;
  maxLength: number | null = null;
}

export class UrlProperties extends TypeProperties { // Probably needed for backend, but not used in frontend
  strictValidation: boolean | null = null;
}

export class VocabularyProperties extends TypeProperties {
  url: string | null = null;
  idField: string | null = null;
  labelField: string | null = null;
  urlParams: UrlParameter[] = [];
}

export interface UrlParameter {
  placeholder: string;
  valueFromField: string;
}

export enum FieldType {
  string = "string",
  url = "url",
  email = "email",
  phone = "phone",
  select = "select",
  radio = "radio",
  largeText = "largeText",
  richText = "richText",
  composite = "composite",
  chooseOne = "chooseOne",
  number = "number",
  bool = "bool",
  vocabulary = "vocabulary",
  checkbox = "checkbox",
  date = "date",
  scale = "scale",
  array = "array",
}

export type FieldTypePropertiesMap = {
  [K in keyof typeof propertiesFactory]: InstanceType<(typeof propertiesFactory)[K]>;
};

const propertiesFactory: Record<FieldType, new () => TypeProperties> = {
  [FieldType.string]: TextProperties,
  [FieldType.url]: PatternProperties,
  [FieldType.email]: PatternProperties,
  [FieldType.phone]: PatternProperties,
  [FieldType.largeText]: TextProperties,
  [FieldType.richText]: TextProperties,
  [FieldType.date]: DateProperties,
  [FieldType.number]: NumberProperties,
  [FieldType.vocabulary]: VocabularyProperties,
  [FieldType.select]: TypeProperties,
  [FieldType.radio]: TypeProperties,
  [FieldType.checkbox]: CustomProperties,
  [FieldType.bool]: CustomProperties,
  [FieldType.scale]: CustomProperties,
  [FieldType.composite]: TypeProperties,
  [FieldType.chooseOne]: TypeProperties,
  [FieldType.array]: TypeProperties,
};
