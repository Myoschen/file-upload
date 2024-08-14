import { useRef, useState } from 'react'
import Dropzone from 'react-dropzone'
import { CheckCircledIcon, TrashIcon, UploadIcon } from '@radix-ui/react-icons'
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
}

export default function Home() {
  const [open, setOpen] = useState<boolean>(false)
  const [files, setFiles] = useState<File[]>([])
  const [done, setDone] = useState<number>(0)
  const [status, setStatus] = useState<Status>(Status.Idle)
  const control = useRef<AbortController | null>(null)
  const hasFiles = files.length > 0

  const handleOpenChange = (open: boolean) => {
    if (!open) control.current?.abort()
    setOpen(open)
  }

  const handleDrop = (files: File[]) => {
    setFiles(prev => [...prev, ...files])
  }

  const handleRemove = (index: number) => {
    setFiles(f => f.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    try {
      control.current = new AbortController()
      setStatus(Status.Uploading)
      for (const file of files) {
        if (control.current?.signal.aborted) {
          throw Error('Cancelled!')
        }
        const formData = new FormData()
        formData.append('file', file)
        await sleep()
        await api.post('file', { body: formData, signal: control.current.signal }).json<Response>()
        await sleep()
        toast.success('Upload Successful!')
        setDone(d => d + 1)
      }
      setStatus(Status.Completed)
    } catch (err) {
      if (err instanceof Error && err.name === 'HTTPError') {
        const resp = await (err as HTTPError).response.json<Response>()
        toast.error(resp.data.message)
      } else if (err instanceof Error) {
        toast.error(err.message)
      }
    } finally {
      control.current = null
      setDone(0)
      setFiles([])
      setStatus(Status.Idle)
    }
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
                    <Button size="sm" onClick={handleUpload}>Upload</Button>
                  </div>
                </>
              )}
            </>
          )}
          {status === Status.Uploading && (
            <div className="flex flex-col items-center gap-y-2 py-20">
              <Progress value={(done / files.length) * 100} />
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          )}
          {status === Status.Completed && (
            <div className="flex flex-col items-center gap-y-2 py-20">
              <CheckCircledIcon className="size-10" />
              <p className="text-sm font-medium">Upload Successful!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
