import { Button } from '@/components/button'
import { GradientBackground } from '@/components/gradient'
import { Link } from '@/components/link'
import Logo from '@/components/logo'
import { Field, Input, Label } from '@headlessui/react'
import { clsx } from 'clsx'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Register',
    description: 'Create an account to get started.',
}

export default function Register() {
    return (
        <main className="overflow-hidden bg-gray-50">
            <GradientBackground />
            <div className="isolate flex min-h-dvh items-center justify-center p-6 lg:p-8">
                <div className="w-full max-w-md rounded-xl bg-white shadow-md ring-1 ring-black/5">
                    <form action="#" method="POST" className="p-7 sm:p-11">
                        <div className="flex items-start">
                            <Link href="/" title="Home">
                                <Logo />
                            </Link>
                        </div>
                        <h1 className="mt-8 text-base/6 font-medium">Create an account</h1>
                        <p className="mt-1 text-sm/5 text-gray-600">
                            Submit the form below to get started.
                        </p>
                        <div className='grid grid-cols-2 gap-4'>
                            <Field className="mt-8 space-y-3">
                                <Label className="text-sm/5 font-medium">First Name</Label>
                                <Input
                                    required
                                    autoFocus
                                    type="text"
                                    name="first_name"
                                    className={clsx(
                                        'block w-full rounded-lg border border-transparent shadow ring-1 ring-black/10',
                                        'px-[calc(theme(spacing.2)-1px)] py-[calc(theme(spacing[1.5])-1px)] text-base/6 sm:text-sm/6',
                                        'data-[focus]:outline data-[focus]:outline-2 data-[focus]:-outline-offset-1 data-[focus]:outline-black',
                                    )}
                                />
                            </Field>
                            <Field className="mt-8 space-y-3">
                                <Label className="text-sm/5 font-medium">Last Name</Label>
                                <Input
                                    required
                                    autoFocus
                                    type="text"
                                    name="last_name"
                                    className={clsx(
                                        'block w-full rounded-lg border border-transparent shadow ring-1 ring-black/10',
                                        'px-[calc(theme(spacing.2)-1px)] py-[calc(theme(spacing[1.5])-1px)] text-base/6 sm:text-sm/6',
                                        'data-[focus]:outline data-[focus]:outline-2 data-[focus]:-outline-offset-1 data-[focus]:outline-black',
                                    )}
                                />
                            </Field>
                        </div>

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
                            <Button type="submit" className="w-full">
                                Sign in
                            </Button>
                        </div>
                    </form>
                    <div className="m-1.5 rounded-lg bg-gray-50 py-4 text-center text-sm/5 ring-1 ring-black/5">
                        Already a member?{' '}
                        <Link href="/login" className="font-medium hover:text-gray-600">
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
