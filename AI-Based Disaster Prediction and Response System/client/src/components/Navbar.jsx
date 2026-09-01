import React from 'react'

function Navbar() {
  return (
    <nav className='fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-md border-b border-border'>
      <div className='max-w-[1200px] mx-auto px-5 h-14 flex items-center justify-between'>
        <div className='flex items-center gap-2.5'>
          <div className='w-2 h-2 rounded-full bg-red-un' />
          <span className='text-sm font-semibold text-ink tracking-tight'>AI-DPRS</span>
        </div>
        <a href='/detect-page'
          className='text-xs font-medium text-ink-muted border border-border rounded-full px-4 py-1.5 hover:border-ink-muted hover:text-ink transition'>
          Post-Disaster Detection
        </a>
      </div>
    </nav>
  )
}

export default Navbar
