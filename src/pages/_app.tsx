import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { app } from '@/lib/firebase'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const auth = getAuth(app)

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error)
        })
      }
    })
  }, [])

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
        <footer className="text-center text-sm text-purple-300 py-4 bg-black/80">
          © {new Date().getFullYear()} Rave Banner. Built for the community, independently maintained with PLUR.
        </footer>
      </div>
    </>
  )
}
