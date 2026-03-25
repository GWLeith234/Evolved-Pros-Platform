'use client'
import { useState, useRef } from 'react'

interface MuxUploaderProps {
  lessonId: string
  existingPlaybackId?: string | null
  onUploadComplete: (uploadId: string) => void
}

export function MuxUploader({ lessonId: _lessonId, existingPlaybackId, onUploadComplete }: MuxUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setStatus('uploading')
    setProgress(0)
    setErrorMsg('')

    try {
      // 1. Get upload URL from our API
      const res = await fetch('/api/admin/mux-upload', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to get upload URL')
      }
      const { uploadUrl, uploadId } = await res.json() as { uploadUrl: string; uploadId: string }

      // 2. Upload directly to Mux via XHR (for progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => resolve()
        xhr.onerror = () => reject(new Error('Upload failed'))
        xhr.open('PUT', uploadUrl)
        xhr.send(file)
      })

      setStatus('processing')
      onUploadComplete(uploadId)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }

  return (
    <div style={{ border: '1px dashed rgba(27,60,90,0.2)', borderRadius: 4, padding: 24, textAlign: 'center' }}>
      {existingPlaybackId && status === 'idle' && (
        <div style={{ marginBottom: 12, fontSize: 12, color: '#2a9d4f', fontWeight: 600 }}>
          ✓ Video uploaded — Playback ID: {existingPlaybackId.slice(0, 16)}…
        </div>
      )}

      {(status === 'idle' || status === 'error') && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-5 py-2.5"
            style={{ background: '#1b3c5a', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {existingPlaybackId ? 'Replace Video' : 'Upload Video'}
          </button>
          <p className="font-condensed text-[11px] mt-2" style={{ color: '#7a8a96' }}>
            MP4, MOV, or MKV · Max 10 GB
          </p>
          {errorMsg && (
            <p className="font-condensed text-[11px] mt-2 font-semibold" style={{ color: '#ef0e30' }}>
              {errorMsg}
            </p>
          )}
        </>
      )}

      {status === 'uploading' && (
        <div>
          <div className="font-condensed text-[12px] mb-2" style={{ color: '#1b3c5a' }}>
            Uploading… {progress}%
          </div>
          <div style={{ height: 4, background: 'rgba(27,60,90,0.1)', borderRadius: 2 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#68a2b9', borderRadius: 2, transition: 'width 0.2s' }} />
          </div>
        </div>
      )}

      {status === 'processing' && (
        <div className="font-condensed text-[12px] font-semibold" style={{ color: '#c9a84c' }}>
          ⏳ Mux is processing your video — this takes 1–3 minutes.
          The lesson will show the video once processing completes.
        </div>
      )}
    </div>
  )
}
