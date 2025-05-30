import BitSet from 'bitset/bitset';
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

export class TypeInfo {
  type: 'composite' | 'string' | 'vocabulary' | 'select' | 'number' | 'double' | 'largeText' | 'richText' | 'radio' | 'checkbox' | 'scale' | 'date' | 'url' | 'email' | 'phone' | 'chooseOne' | 'radioGrid';
  values: string[];
  vocabulary: string;
  multiplicity: boolean


  constructor(type?: typeof TypeInfo.prototype.type) {
    if (type)
      this.type = type;
    else
      this.type = 'string';
    this.values = [];
    this.vocabulary = null;
    this.multiplicity = false;
  }
}

export class Form {
  dependsOn: Dependent;
  affects: Dependent[];
  vocabulary: string;
  group: string;
  description: StyledText;
  suggestion: StyledText;
  placeholder: string;
  mandatory: boolean;
  immutable: boolean;
  display: Display;

  constructor() {
    this.dependsOn = null;
    this.affects = null;
    this.vocabulary = null;
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
  hasBorder: boolean;
  order: number;
  placement: string;
  visible: boolean;
  cssClasses: string;
  style: string;

  constructor() {
    this.hasBorder = false;
    this.order = 0;
    this.placement = '';
    this.cssClasses = '';
    this.style = '';
    this.visible = true;
  }
}

export class StyledText {
  cssClasses: string;
  style: string;
  text: string;
  showLess: boolean;

  constructor() {
    this.cssClasses = '';
    this.style = '';
    this.text = '';
    this.showLess = false;
  }
}

export class Field {
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

  constructor(id: string, type?: typeof TypeInfo.prototype.type) {
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
  id: string;
  name: string;
  description: string;
  subType: string;
  order: number;
  subSections: Section[];
  fields: Field[];
  required: Required;

  constructor() {
    this.id = null;
    this.name = null;
    this.description = null;
    this.subSections = null;
    this.fields = null;
    this.order = 0;
  }
}

export class GroupedFields {
  id: string;
  name: string;
  description: string;
  order: number;
  fields: Field[];
  required: Required;


  constructor() {
    this.id = '';
    this.name = '';
    this.description = '';
    this.order = 0;
    this.fields = [];
    this.required = new Required();
  }
}

export class Model {
  id: string;
  name: string | null;
  description: string | null;
  notice: string | null;
  type: string;
  subType: string;
  resourceType: string;
  creationDate: string;
  createdBy: string;
  modifiedBy: string;
  sections: Section[];
  configuration: Configuration;
  locked: boolean;
  active: boolean;


  constructor() {
    this.name = null;
    this.description = null;
    this.notice = null;
    this.sections = [new Section()];
    this.configuration = new Configuration();
    this.locked = false;
    this.active = false;
  }

  get maxId(): number {
    let maxId = 0;
    const ids: string[] = jp.query(this, '$..sections..name');
    ids.forEach(id => {
      if (Utils.isNumeric(id) && (parseInt(id) > maxId))
        maxId = parseInt(id);
    });

    return maxId;
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
