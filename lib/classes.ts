/** A "class" is the pair (class_name, stream). It is encoded into the URL as classId. */
export function makeClassId(className: string, stream: string | null): string {
  return encodeURIComponent(`${className}::${stream ?? ''}`);
}

export function parseClassId(classId: string): { className: string; stream: string | null } {
  let decoded = classId;
  try {
    decoded = decodeURIComponent(classId);
  } catch {
    // Already decoded; keep as is.
  }
  const [className = '', stream = ''] = decoded.split('::');
  return { className, stream: stream === '' ? null : stream };
}

export function classLabel(className: string, stream: string | null): string {
  return stream ? `${className} ${stream}` : className;
}
