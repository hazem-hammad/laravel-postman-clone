import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'code', 'pre', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
  'img', 'em', 'strong', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'hr', 'br', 'span', 'div', 'del', 'sup', 'sub',
];
const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'lang'];

export function sanitizeIssueHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ['target', 'rel'],
  });
  return clean.replace(/<a (?![^>]*\btarget=)/g, '<a target="_blank" rel="noopener noreferrer" ');
}
