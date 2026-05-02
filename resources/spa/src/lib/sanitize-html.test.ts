import { describe, it, expect } from 'vitest';
import { sanitizeIssueHtml } from './sanitize-html';

describe('sanitizeIssueHtml', () => {
  it('strips script tags', () => {
    expect(sanitizeIssueHtml('<p>hi<script>alert(1)</script></p>')).not.toContain(
      '<script>',
    );
  });

  it('strips on-event handlers', () => {
    expect(sanitizeIssueHtml('<img src="x" onerror="alert(1)">')).not.toContain(
      'onerror',
    );
  });

  it('rewrites anchors to open in new tab', () => {
    expect(sanitizeIssueHtml('<a href="https://x">x</a>')).toContain('target="_blank"');
  });
});
