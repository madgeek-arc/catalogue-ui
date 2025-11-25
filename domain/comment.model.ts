export interface Thread {
  id: string;
  fieldId: string;
  messages: Comment[];
}

export interface CreateThread {
  fieldId: string;
  message: Comment;
}

export class Comment {
  id?: string;
  body?: string;
  authorId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  mentions?: string[];
}
