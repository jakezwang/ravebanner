import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" type="image/x-icon" />
        <meta name="theme-color" content="#1a1a2e" />
      </Head>
      <div className="min-h-screen flex flex-col justify-between">
        <main className="flex-grow">
          <Component {...pageProps} />
        </main>
        <footer className="bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-center text-xs text-purple-400 py-6">
          © 2025 Festival Flags. Community-powered and independently maintained.
        </footer>
      </div>
    </>
  )
}
