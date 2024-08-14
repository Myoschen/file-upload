import { useRef, useState } from 'react'
import Dropzone from 'react-dropzone'
import { CheckCircledIcon, CrossCircledIcon, TrashIcon, UploadIcon } from '@radix-ui/react-icons'
import ky, { type HTTPError } from 'ky'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progres'
import { ScrollArea } from '@/components/ui/scroll-area'
import { sleep } from '@/lib/utils'

const api = ky.create({ prefixUrl: process.env.NEXT_PUBLIC_API_ENDPOINT })

interface Response {
  data: {
    message: string
  }
}

enum Status {
  Idle = 'Idle',
  Uploading = 'Uploading',
  Completed = 'Completed',
  Failed = 'Failed',
}

export default function Home() {
  const [open, setOpen] = useState<boolean>(false)
  const [files, setFiles] = useState<File[]>([])
  const [done, setDone] = useState<number>(0)
  const [status, setStatus] = useState<Status>(Status.Idle)
  const control = useRef<AbortController | null>(null)
  const hasFiles = files.length > 0

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      control.current?.abort()
      setFiles([])
      setDone(0)
      setStatus(Status.Idle)
    }
    setOpen(open)
  }

  const handleDrop = (files: File[]) => {
    setFiles(prev => [...prev, ...files])
  }

  const handleRemove = (index: number) => {
    setFiles(f => f.filter((_, i) => i !== index))
  }

  const handleUpload = async (index: number = 0) => {
    try {
      control.current = new AbortController()
      setStatus(Status.Uploading)
      for (const file of files.slice(index)) {
        if (control.current?.signal.aborted) {
          setStatus(Status.Failed)
          throw Error('Cancelled!')
        }
        const formData = new FormData()
        formData.append('file', file)
        await sleep()
        await api.post('file', { body: formData, signal: control.current.signal }).json<Response>()
        toast.success('Upload Successful!')
        setDone(d => d + 1)
      }
      setTimeout(() => setStatus(Status.Completed), 1500)
    } catch (err) {
      if (err instanceof Error && err.name === 'HTTPError') {
        const resp = await (err as HTTPError).response.json<Response>()
        toast.error(resp.data.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      }
    } finally {
      control.current = null
    }
  }

  const handleCancel = () => {
    control.current?.abort()
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild={true}>
          <Button size="sm">Upload</Button>
        </DialogTrigger>
        <DialogContent>
          {status === Status.Idle && (
            <>
              <Dropzone multiple={true} onDrop={handleDrop}>
                {({ getRootProps, getInputProps }) => (
                  <div
                    {...getRootProps({
                      'className': 'rounded-lg border-2 border-dashed border-neutral-300 py-20 active:bg-neutral-200',
                      'role': 'button',
                      'aria-description': 'drag and drop area',
                    })}
                  >
                    <Input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-y-2">
                      <UploadIcon className="size-6" />
                      <p className="font-sans text-sm">Drag and drop some files here, or click to select files</p>
                    </div>
                  </div>
                )}
              </Dropzone>
              {hasFiles && (
                <>
                  <ScrollArea className="max-h-[120px] gap-y-1 overflow-y-scroll">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between pl-1 pr-3">
                        <p className="text-sm font-medium">{file.name}</p>
                        <button
                          className="rounded-full p-1 transition-colors ease-out hover:bg-neutral-200"
                          onClick={() => handleRemove(index)}
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="ml-auto">
                    <Button size="sm" onClick={() => handleUpload()}>Upload</Button>
                  </div>
                </>
              )}
            </>
          )}
          {status === Status.Uploading && (
            <div className="flex h-60 flex-col items-center justify-center gap-y-2">
              <Progress value={(done / files.length) * 100} />
              <p className="text-sm font-medium">Uploading...</p>
              <Button
                className="absolute bottom-6 right-6"
                size="sm"
                onClick={handleCancel}
                disabled={done === files.length}
              >
                Cancel
              </Button>
            </div>
          )}
          {status === Status.Completed && (
            <div className="flex h-60 flex-col items-center justify-center gap-y-2">
              <CheckCircledIcon className="size-6" />
              <p className="text-sm font-medium">Upload Successful!</p>
            </div>
          )}
          {status === Status.Failed && (
            <div className="flex h-60 flex-col items-center justify-center gap-y-2">
              <CrossCircledIcon className="size-6" />
              <p className="text-sm font-medium">Upload Failed!</p>
              <Button className="absolute bottom-6 right-6" size="sm" onClick={() => handleUpload(done)}>Retry</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
