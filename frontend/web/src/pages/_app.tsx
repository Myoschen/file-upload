import '@/styles/global.css'

import type { AppProps } from 'next/app'
import Head from 'next/head'
import { GeistSans } from 'geist/font/sans'

import { Toaster } from '@/components/ui/sonner'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>file-upload</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-geist-sans: ${GeistSans.style.fontFamily};
              }
            `,
          }}
        />
      </Head>
      <>
        <Component {...pageProps} />
        <Toaster />
      </>
    </>
  )
}
