"use client"

import { GradientBackground } from '@/components/gradient';
import Logo from '@/components/logo';
import Head from 'next/head';
import Image from 'next/image';


export default function Download() {

    return (
        <>
            <Head>
                <title>Download</title>
                <meta name="description"
                    content="Download the app to get started."
                />
            </Head>
            <main className="overflow-hidden bg-gray-50">
                <GradientBackground />

                <div className="isolate flex flex-col items-center justify-center p-6 lg:p-8 min-h-dvh gap-8 ">
                    <div className="w-full max-w-md  flex flex-col items-center gap-1">
                        <Logo />
                        <h1 className="text-base/6 font-medium pt-3">Download the app</h1>
                        <p className="text-sm/5 text-gray-600">
                            Scan the QR code to download the app.
                        </p>
                    </div>
                    <div className="w-full max-w-md rounded-xl bg-white shadow-md ring-1 ring-black/5">
                        <Image
                            src={'/qr-code.png'}
                            width={256}
                            height={256}
                            className='w-[30rem] h-[20rem] mx-auto mt-8'
                            alt='QR code'
                        />
                    </div>
                </div>

            </main >
        </>

    )
}
