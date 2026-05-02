/**
 * Returns Tailwind class fragments for an HTTP method's text + bg, mapped
 * to the design-token colors. Defaults to a neutral grey for unknown methods.
 */
const METHOD_TEXT: Record<string, string> = {
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
  HEAD: 'text-method-head',
  OPTIONS: 'text-method-options',
};

export function methodTextClass(method: string): string {
  return METHOD_TEXT[method.toUpperCase()] ?? 'text-fg-subtle';
}
