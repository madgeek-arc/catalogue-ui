export function formatTopic(template: string, params: Record<string, string>): string {
  return Object.entries(params).reduce((s, [key, value]) => s.split(`{${key}}`).join(value), template);
}
