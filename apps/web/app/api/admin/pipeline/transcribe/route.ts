// Polyfill File for Node 18
if (typeof globalThis.File === 'undefined') {
  ;(globalThis as any).File = class File extends Blob {
    name: string; lastModified: number
    constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
      super(bits, options); this.name = name; this.lastModified = options?.lastModified ?? Date.now()
    }
  }
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const guard = await requireAdminApi()
    if (guard instanceof Response) return guard

    let formData: FormData
    try { formData = await request.formData() } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file is required' }, { status: 422 })
    }

    const blob = file as Blob
    const fileName = ('name' in blob ? (blob as Record<string, unknown>).name as string : 'file').toLowerCase()

    // Text files — return directly
    if (fileName.endsWith('.txt')) {
      const text = await blob.text()
      return NextResponse.json({ transcript: text })
    }

    // Audio files — use Whisper
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })

    const openai = new OpenAI({ apiKey })
    const audioFile = new File([await blob.arrayBuffer()], fileName, { type: blob.type })

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    })

    return NextResponse.json({ transcript: transcription })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[pipeline/transcribe] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
