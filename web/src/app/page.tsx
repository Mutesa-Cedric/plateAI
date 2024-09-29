import { BentoCard } from '@/components/bento-card'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { Footer } from '@/components/footer'
import { Gradient } from '@/components/gradient'
import { Keyboard } from '@/components/keyboard'
import { Map } from '@/components/map'
import { Navbar } from '@/components/navbar'
import { Screenshot } from '@/components/screenshot'
import { Heading, Subheading } from '@/components/text'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  description:
    'Our AI-powered app analyzes your meals and eating habits, offering personalized dietary suggestions to promote balanced nutrition and a healthier lifestyle.',
}

function Hero() {
  return (
    <div className="relative">
      <Gradient className="absolute inset-2 bottom-0 rounded-4xl ring-1 ring-inset ring-black/5" />
      <Container className="relative">
        <Navbar />

        <div className="pb-24 pt-16 sm:pb-32 sm:pt-24 md:pb-48 md:pt-32">
          <h1 className="font-display text-balance text-5xl/[0.9] font-medium tracking-tight text-gray-950 sm:text-7xl/[0.8] md:text-8xl/[0.8]">
            Eat healthier, live better.
          </h1>
          <p className="mt-8 max-w-3xl text-xl/7 font-medium text-gray-950/75 sm:text-2xl/8">
            Our AI-powered app analyzes your meals and eating habits, offering personalized dietary suggestions to promote balanced nutrition and a healthier lifestyle.
          </p>

          <div className="mt-12 flex flex-col gap-x-6 gap-y-4 sm:flex-row">
            <Button href="/register">Get started</Button>
            {/* <Button variant="secondary" href="#download">
              Download the app
            </Button> */}
          </div>
        </div>
      </Container>
    </div>
  )
}

function FeatureSection() {
  return (
    <div className="overflow-hidden">
      <Container className="pb-24">
        <Heading as="h2" className="max-w-3xl">
          A snapshot of your PlateAI Journey.
        </Heading>
        <Screenshot
          width={1024}
          height={768}
          src="/screenshots/desktop.png"
          className="mt-16 h-[36rem] sm:h-auto sm:w-[76rem]"
        />
      </Container>
    </div>
  )
}

function BentoSection() {
  return (
    <Container>
      <Subheading>Sales</Subheading>
      <Heading as="h3" className="mt-2 max-w-3xl">
        Know more about your diet every step of the way.
      </Heading>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
        <BentoCard
          eyebrow="Insight"
          title="Use image recognition to find your meal"
          description="Plate AI allows users to upload images or videos of their meals, which the AI will analyze to assess nutrient content and determine whether the meal is balanced."
          // graphic={
          //   <div className="h-80 bg-[url(/screenshots/profile.png)] bg-[size:1000px_560px] bg-[left_-109px_top_-112px] bg-no-repeat" />
          // }
          fade={['bottom']}
          className="max-lg:rounded-t-4xl lg:col-span-3 lg:rounded-tl-4xl"
        />
        <BentoCard
          eyebrow="Analysis"
          title="Nutrient Analysis & Diet Suggestions"
          description="Our service provides feedback on the nutrient balance of the meal and offers personalized suggestions on what to add, remove, or modify to improve the meal's nutritional value."
          graphic={
            <div className="absolute inset-0 bg-[url(/screenshots/competitors.png)] bg-[size:1100px_650px] bg-[left_-38px_top_-73px] bg-no-repeat" />
          }
          fade={['bottom']}
          className="lg:col-span-3 lg:rounded-tr-4xl"
        />
        <BentoCard
          eyebrow="Speed"
          title="Get Audio Assistance"
          description="Our AI provides interactive audio feedback, enabling users to discuss their meal choices, receive real-time guidance, and make informed dietary decisions."
          graphic={
            <div className="flex size-full pl-10 pt-10">
              <Keyboard highlighted={['LeftCommand', 'LeftShift', 'D']} />
            </div>
          }
          className="lg:col-span-2 lg:rounded-bl-4xl"
        />
        <BentoCard
          eyebrow="Source"
          title="Get Daily Eating Habits Analytics"
          description="Our app tracks and analyzes users' eating habits over time, identifying patterns and providing tailored advice to improve overall dietary behavior"
          graphic={
            <div className="flex size-full pl-10 pt-10">
              <Keyboard highlighted={['LeftCommand', 'LeftShift', 'D']} />
            </div>
          }
          className="lg:col-span-2"
        />
        <BentoCard
          eyebrow="Limitless"
          title="Maintain your weight"
          description="Plate AI offers a comprehensive analysis of your daily meals, providing insights into your eating habits to achieve your weight goals."
          graphic={<Map />}
          className="max-lg:rounded-b-4xl lg:col-span-2 lg:rounded-br-4xl"
        />
      </div>
    </Container>
  )
}

// function DarkBentoSection() {
//   return (
//     <div
//       id='download'
//       className="mx-2 mt-2 rounded-4xl bg-gray-900 py-32">
//       <Container
//         className='flex flex-col items-center justify-center w-full'
//       >
//         <Subheading dark className='text-center'>download</Subheading>
//         <Heading as="h3" dark className="mt-2 max-w-3xl text-center">
//           Scan the QR code to download the app.
//         </Heading>

//         <Screenshot
//           src={'/qr-code.png'}
//           width={256}
//           height={256}
//           className='w-[30rem] h-[20rem] mx-auto mt-8'
//         />
//       </Container>
//     </div>
//   )
// }

export default function Home() {
  return (
    <div className="overflow-hidden">
      <Hero />
      <main>
        <div className="bg-gradient-to-b from-white from-50% to-gray-100 py-32">
          <FeatureSection />
          <BentoSection />
        </div>
        {/* <DarkBentoSection /> */}
      </main>
      {/* <Testimonials /> */}
      <Footer />
    </div>
  )
}
