// app/api/upload/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';

vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://example.private.blob.vercel-storage.com/meet-uploads/abc123.pdf',
    pathname: 'meet-uploads/abc123.pdf',
  }),
}));

function makeRequest(file: File | null) {
  const formData = new FormData();
  if (file) formData.set('file', file);
  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/upload', () => {
  it('rejects a request with no file', async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(400);
  });

  it('rejects a non-PDF file', async () => {
    const file = new File(['not a pdf'], 'test.txt', { type: 'text/plain' });
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(400);
  });

  it('accepts a valid PDF and returns id + url', async () => {
    const file = new File(['%PDF-1.4 fake content'], 'results.pdf', {
      type: 'application/pdf',
    });
    const res = await POST(makeRequest(file));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBeDefined();
    expect(body.url).toContain('vercel-storage.com');
    expect(body.pathname).toMatch(/^meet-uploads\/.+\.pdf$/);
  });
});