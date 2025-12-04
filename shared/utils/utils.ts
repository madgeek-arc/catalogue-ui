
export class Utils {
  static isNumeric(value: string | null): boolean {
    // Check if the value is empty
    if (value === null)
      return false;

    if (value.trim() === '') {
      return false;
    }

    // Attempt to parse the value as a float
    const number = parseFloat(value);

    // Check if parsing resulted in NaN or the value has extraneous characters
    return !isNaN(number) && isFinite(number) && String(number) === value;
  }
}

export function collectIdsRecursive(node: any[], out: string[] = []): string[] {
  if (node === null || typeof node !== 'object') return out;

  if ('id' in node && node.id != null) {
    out.push(String(node.id));
  }

  // walk arrays and objects
  if (Array.isArray(node)) {
    for (const item of node) collectIdsRecursive(item, out);
  } else {
    for (const key of Object.keys(node)) {
      collectIdsRecursive(node[key], out);
    }
  }

  return out;
}
