'use client'
import hash from '@emotion/hash'
import { useEffect, useState } from 'react'
import { PASSWORD, SALT } from '../constants/constants'

export default function Page() {
  const [pasword, setPassword] = useState('')

  useEffect(() => {
    const hashPassword = hash(`${SALT}${pasword}`)
    if (window.localStorage.getItem('cf-ma-sec') === PASSWORD) {
      window.location.replace(`/${PASSWORD}`)
    }

    if (hashPassword === PASSWORD) {
      window.localStorage.setItem('cf-ma-sec', PASSWORD)
      window.location.replace(`/${PASSWORD}`)
    }
  }, [pasword])

  return (
    <main className="w-screen h-screen flex justify-center items-center">
      <input
        type="text"
        placeholder="PASSWORD"
        className="input input-bordered w-full max-w-xs"
        value={pasword}
        onChange={(e) => setPassword(e.target.value)}
      />
    </main>
  )
}
