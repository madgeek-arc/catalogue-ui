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
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // New format: @{Display Name}(unique.email@domain) -> show only the name, email in tooltip.
    const highlighted = escaped.replace(
      /@\{([^}]*)\}\(([^)]+)\)|@(?!\{)(\S+)/g,
      (_match, name, email, legacyToken) =>
        name !== undefined
          ? `<span class="mention-highlight" title="${email}">@${name}</span>`
          : `<span class="mention-highlight">@${legacyToken}</span>`
    );

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
