export function formatTopic(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce((s, [key, value]) => s.replaceAll(`{${key}}`, value), template);
}
