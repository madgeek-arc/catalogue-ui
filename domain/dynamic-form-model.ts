import BitSet from 'bitset/bitset';

export class Group {
  id: string;
  name: string;
  required: boolean;
  order: number;
}

export class Required {
  topLevel: number;
  total: number;
}

export class Dependent {
  id: number;
  name: string;
}

export class TypeInfo {
  type: string;
  values: string[];
  vocabulary: string;
  multiplicity: boolean;
}

export class Form {
  dependsOn: Dependent;
  affects: Dependent[];
  vocabulary: string;
  group: string;
  description: string;
  suggestion: string;
  placeholder: string;
  mandatory: boolean;
  immutable: boolean;
  order: number;
  visible: boolean;
}

export class Display {
  placement: string;
  order: number;
}

export class Field {
  id: string;
  name: string;
  parentId: string;
  parent: string;
  label: string;
  accessPath: string;
  typeInfo: TypeInfo;
  includedInSnippet: boolean;
  form: Form;
  display: Display;
}

export class Fields {
  field: Field;
  subFieldGroups: Fields[];
}

export class FormModel {
  group: Group;
  fields: Fields[];
  required: Required;
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
  field: Fields;
  position: number;
}
