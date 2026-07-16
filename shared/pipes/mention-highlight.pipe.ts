import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ standalone: true, name: 'mentionHighlight' })
export class MentionHighlightPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string): SafeHtml {
    if (!text) return '';

    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const highlighted = escaped.replace(
      /@([^\s]+)/g,
      '<span class="mention-highlight">@$1</span>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
