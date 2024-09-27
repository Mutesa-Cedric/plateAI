"use client"

import { Button } from '@/components/button'
import { GradientBackground } from '@/components/gradient'
import { Link } from '@/components/link'
import Loader from '@/components/Loader'
import Logo from '@/components/logo'
import useAuth from '@/hooks/useAuth'
import { Field, Input, Label } from '@headlessui/react'
import { clsx } from 'clsx'
import Head from 'next/head'


export default function Login() {
  const { login, loggingIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    login(email, password);
  }

  return (
    <>
      <Head>
        <title>Login</title>
        <meta name="description" content="Sign in to your account to continue." />
      </Head>
      <main className="overflow-hidden bg-gray-50">
        <GradientBackground />
        <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md rounded-xl bg-white shadow-md ring-1 ring-black/5">
            <form
              onSubmit={handleSubmit}
              className="p-7 sm:p-11">
              <div className="flex items-start">
                <Link href="/" title="Home">
                  <Logo className="h-9 fill-black" />
                </Link>
              </div>
              <h1 className="mt-8 text-base/6 font-medium">Welcome back!</h1>
              <p className="mt-1 text-sm/5 text-gray-600">
                Sign in to your account to continue.
              </p>
              <Field className="mt-8 space-y-3">
                <Label className="text-sm/5 font-medium">Email</Label>
                <Input
                  required
                  autoFocus
                  type="email"
                  name="email"
                  className={clsx(
                    'block w-full rounded-lg border border-transparent shadow ring-1 ring-black/10',
                    'px-[calc(theme(spacing.2)-1px)] py-[calc(theme(spacing[1.5])-1px)] text-base/6 sm:text-sm/6',
                    'data-[focus]:outline data-[focus]:outline-2 data-[focus]:-outline-offset-1 data-[focus]:outline-black',
                  )}
                />
              </Field>
              <Field className="mt-8 space-y-3">
                <Label className="text-sm/5 font-medium">Password</Label>
                <Input
                  required
                  type="password"
                  name="password"
                  className={clsx(
                    'block w-full rounded-lg border border-transparent shadow ring-1 ring-black/10',
                    'px-[calc(theme(spacing.2)-1px)] py-[calc(theme(spacing[1.5])-1px)] text-base/6 sm:text-sm/6',
                    'data-[focus]:outline data-[focus]:outline-2 data-[focus]:-outline-offset-1 data-[focus]:outline-black',
                  )}
                />
              </Field>
              <div className="mt-8">
                <Button
                  disabled={loggingIn}
                  type="submit" className="w-full">
                  {loggingIn ? <Loader /> : "Sign in"}
                </Button>
              </div>
            </form>
            <div className="m-1.5 rounded-lg bg-gray-50 py-4 text-center text-sm/5 ring-1 ring-black/5">
              Not a member?{' '}
              <Link href="/register" className="font-medium hover:text-gray-600">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>

  )
}
