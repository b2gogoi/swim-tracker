// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadForm } from './upload-form';

function makePdfFile(name = 'results.pdf') {
  return new File(['%PDF-1.4 fake content'], name, { type: 'application/pdf' });
}

function makeTextFile(name = 'notes.txt') {
  return new File(['plain text'], name, { type: 'text/plain' });
}

describe('UploadForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the idle drop zone by default', () => {
    render(<UploadForm />);
    expect(screen.getByText(/drag a pdf here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload results/i })).toBeDisabled();
  });

  it('rejects a non-PDF file dropped into the zone', () => {
    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeTextFile()] },
    });

    expect(screen.getByText(/only pdf files are accepted/i)).toBeInTheDocument();
  });

  it('accepts a valid PDF and enables the upload button', () => {
    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makePdfFile('state.pdf')] },
    });

    expect(screen.getByText(/state\.pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload results/i })).toBeEnabled();
  });

  it('uploads the file and displays the returned id and url', async () => {
    const mockResponse = {
      id: '6ea13ee0-3ca4-4d09-9a7b-0b92714b7171',
      url: 'https://ieek7cu3gsdcjyzo.private.blob.vercel-storage.com/meet-uploads/6ea13ee0.pdf',
      pathname: 'meet-uploads/6ea13ee0.pdf',
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makePdfFile()] } });

    await user.click(screen.getByRole('button', { name: /upload results/i }));

    await waitFor(() => {
      expect(screen.getByText(/status: saved/i)).toBeInTheDocument();
    });
    expect(screen.getByText(mockResponse.id)).toBeInTheDocument();
    expect(screen.getByText(mockResponse.url)).toBeInTheDocument();
  });

  it('shows a server-provided error message on a failed upload', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'File exceeds 4.5MB limit for this endpoint' }),
    });

    const user = userEvent.setup();
    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makePdfFile()] } });

    await user.click(screen.getByRole('button', { name: /upload results/i }));

    await waitFor(() => {
      expect(screen.getByText(/exceeds 4\.5mb limit/i)).toBeInTheDocument();
    });
  });

  it('shows a generic error when the network request itself fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));

    const user = userEvent.setup();
    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makePdfFile()] } });

    await user.click(screen.getByRole('button', { name: /upload results/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not reach the server/i)).toBeInTheDocument();
    });
  });

  it('copies the blob url to the clipboard when "Copy URL" is clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
        id: 'abc123',
        url: 'https://example.private.blob.vercel-storage.com/meet-uploads/abc123.pdf',
        pathname: 'meet-uploads/abc123.pdf',
        }),
    });

    const user = userEvent.setup();

    // Define the clipboard mock AFTER setup() so it isn't overwritten
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
    });

    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makePdfFile()] } });
    await user.click(screen.getByRole('button', { name: /upload results/i }));
    await waitFor(() => screen.getByText(/status: saved/i));

    await user.click(screen.getByRole('button', { name: /copy url/i }));

    expect(writeTextMock).toHaveBeenCalledWith(
        'https://example.private.blob.vercel-storage.com/meet-uploads/abc123.pdf'
    );
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    });

  it('resets to the idle state when "Upload another" is clicked', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'abc123', url: 'https://x.blob.vercel-storage.com/x.pdf', pathname: 'x.pdf' }),
    });

    const user = userEvent.setup();
    render(<UploadForm />);
    const dropzone = screen.getByText(/drag a pdf here/i).closest('div')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makePdfFile()] } });
    await user.click(screen.getByRole('button', { name: /upload results/i }));
    await waitFor(() => screen.getByText(/status: saved/i));

    await user.click(screen.getByRole('button', { name: /upload another/i }));

    expect(screen.getByText(/drag a pdf here/i)).toBeInTheDocument();
  });
});