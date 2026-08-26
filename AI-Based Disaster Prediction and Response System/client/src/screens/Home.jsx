import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import LeftBox from '../components/LeftBox'
import MiddleBox from '../components/MiddleBox'
import Chatbot from '../components/Chatbot'

function Home() {
  const [predicated, setPredicated] = useState("")
  const [state, setstate] = useState(0)

  return (
    <div className='min-h-screen bg-cream'>
      <Navbar />
      <div className='max-w-[1200px] mx-auto px-5 pt-28 pb-16'>
        {/* Hero */}
        {!predicated && (
          <header className='mb-12'>
            <h1 className='font-serif text-4xl lg:text-5xl text-ink leading-tight mb-3'>
              Disaster Risk Assessment
            </h1>
            <p className='text-ink-muted text-base max-w-xl'>
              Enter a location and parameters below to generate a prediction using historical data models.
            </p>
          </header>
        )}
        {predicated && (
          <header className='mb-8'>
            <button onClick={() => { setPredicated(''); setstate(0) }}
              className='text-sm text-ink-muted hover:text-ink transition mb-4 flex items-center gap-1'>
              <span>&larr;</span> New assessment
            </button>
          </header>
        )}

        {/* Main content */}
        <div className='flex flex-col lg:flex-row gap-8'>
          <div className='w-full lg:w-[380px] shrink-0'>
            <LeftBox setPredicated={setPredicated} setstate={setstate} />
          </div>
          <div className='flex-1 min-w-0'>
            <MiddleBox predicated={predicated} state={state} />
          </div>
        </div>
      </div>
      <Chatbot />
    </div>
  )
}

export default Home
