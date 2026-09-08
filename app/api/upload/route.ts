import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB — default limit for Vercel route handlers

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Only PDF files are accepted' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit for this endpoint` },
      { status: 413 }
    );
  }

  const fileId = randomUUID();
  const pathname = `meet-uploads/${fileId}.pdf`;

  const blob = await put(pathname, file, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/pdf',
  });

  return NextResponse.json({
    id: fileId,
    url: blob.url,
    pathname: blob.pathname,
  });
}