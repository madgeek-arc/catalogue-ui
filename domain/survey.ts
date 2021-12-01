import {User} from "./userInfo";

export class Survey {
  id: string;
  name: string;
  description: string;
  type: string;
  creationDate: string;
  createdBy: User;
  modificationDate: string;
  modifiedBy: User;
  chapters: Chapter[];
}

export class Chapter {
  id: string;
  name: string;
  description: string;
  sections: string[];
}
