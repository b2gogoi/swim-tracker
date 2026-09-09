'use client';

import { useState, useCallback, useRef } from 'react';

type Status = 'idle' | 'dragging' | 'selected' | 'uploading' | 'success' | 'error';

interface UploadResult {
  id: string;
  url: string;
  pathname: string;
}

export function UploadForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = useCallback((candidate: File | undefined) => {
    if (!candidate) return;
    if (candidate.type !== 'application/pdf') {
      setErrorMessage('Only PDF files are accepted.');
      setStatus('error');
      return;
    }
    setFile(candidate);
    setErrorMessage(null);
    setStatus('selected');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      validateAndSetFile(e.dataTransfer.files[0]);
    },
    [validateAndSetFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMessage(null);

    const formData = new FormData();
    formData.set('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? 'Upload failed.');
        setStatus('error');
        return;
      }

      setResult(data);
      setStatus('success');
    } catch {
      setErrorMessage('Could not reach the server. Check your connection and try again.');
      setStatus('error');
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setErrorMessage(null);
    setStatus('idle');
  };

  const copyUrl = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-[560px] px-6 py-16">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-medium text-[#EAF2F8]">
        Meet ingest
      </h1>
      <p className="mt-2 text-sm text-[#8FAEC9]">
        Upload a results PDF to begin processing.
      </p>

      {status !== 'success' && (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setStatus('dragging');
            }}
            onDragLeave={() => setStatus(file ? 'selected' : 'idle')}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`mt-8 flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-6 py-14 text-center transition-colors ${
              status === 'dragging'
                ? 'border-[#FFB238] bg-[#123153]'
                : 'border-[#2E5C82] bg-[#0F2A47] hover:border-[#4A7BA6]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => validateAndSetFile(e.target.files?.[0])}
            />
            {file ? (
              <p className="font-[family-name:var(--font-mono)] text-sm text-[#EAF2F8]">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            ) : (
              <p className="text-sm text-[#8FAEC9]">
                Drag a PDF here, or click to browse
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="mt-3 text-sm text-[#E4572E]">{errorMessage}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            className="mt-6 w-full border border-[#FFB238] bg-[#FFB238] py-3 text-sm font-medium text-[#0A1F33] transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            {status === 'uploading' ? 'Uploading…' : 'Upload results'}
          </button>
        </>
      )}

      {status === 'success' && result && (
        <div className="mt-8 border border-[#2E5C82] bg-[#0F2A47] p-6">
          <div className="flex items-center gap-2 text-xs tracking-wide text-[#4CAF6D]">
            <span className="h-1.5 w-1.5 bg-[#4CAF6D]" />
            STATUS: SAVED
          </div>

          <dl className="mt-4 space-y-3 font-[family-name:var(--font-mono)] text-sm">
            <div>
              <dt className="text-[#8FAEC9]">File ID</dt>
              <dd className="mt-0.5 text-[#FFB238]">{result.id}</dd>
            </div>
            <div>
              <dt className="text-[#8FAEC9]">Blob URL</dt>
              <dd className="mt-0.5 break-all text-[#FFB238]">{result.url}</dd>
            </div>
          </dl>

          <div className="mt-5 flex gap-3">
            <button
              onClick={copyUrl}
              className="border border-[#2E5C82] px-4 py-2 text-sm text-[#EAF2F8] hover:border-[#4A7BA6]"
            >
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 text-sm text-[#8FAEC9] hover:text-[#EAF2F8]"
            >
              Upload another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}