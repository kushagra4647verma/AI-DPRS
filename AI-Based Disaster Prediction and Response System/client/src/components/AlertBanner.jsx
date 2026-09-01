import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const POLL_INTERVAL = 30 * 60 * 1000 // 30 minutes

function AlertBanner() {
  const [alerts, setAlerts] = useState([])
  const [location, setLocation] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef(null)

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {}, // silently fail if denied
        { enableHighAccuracy: false, timeout: 5000 }
      )
    }
  }, [])

  // Poll for alerts when location is available
  useEffect(() => {
    if (!location) return

    const checkAlerts = async () => {
      setLoading(true)
      try {
        const res = await axios.post('/alerts', {
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 1000, // 1000km radius
        })
        const critical = res.data.alerts.filter(a => a.severity === 'critical' || a.severity === 'warning')
        setAlerts(critical)

        // Browser notification for critical alerts
        if (critical.length > 0 && Notification.permission === 'granted') {
          new Notification('AI-DPRS Alert', {
            body: `${critical.length} active disaster alert(s) near your location`,
            icon: '/favicon.ico',
          })
        }
      } catch { /* silent */ }
      setLoading(false)
    }

    // Check immediately
    checkAlerts()

    // Then poll every 30 minutes
    intervalRef.current = setInterval(checkAlerts, POLL_INTERVAL)

    return () => clearInterval(intervalRef.current)
  }, [location])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (dismissed || alerts.length === 0) return null

  const typeIcon = {
    earthquake: '🔴',
    cyclone: '🌀',
    flood: '🌊',
    disaster: '⚠️',
  }

  return (
    <div className='fixed top-16 left-0 right-0 z-40 px-4'>
      <div className='max-w-[1200px] mx-auto mt-2'>
        <div className='bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <span className='w-2 h-2 bg-red-500 rounded-full animate-pulse' />
                <span className='text-[11px] font-semibold uppercase tracking-wider text-red-700'>
                  Live Alert — {alerts.length} active event{alerts.length > 1 ? 's' : ''} nearby
                </span>
              </div>
              <div className='flex flex-col gap-1.5'>
                {alerts.slice(0, 3).map((alert, i) => (
                  <div key={i} className='flex items-center gap-2'>
                    <span className='text-sm'>{typeIcon[alert.type] || '⚠️'}</span>
                    <span className='text-[12px] text-red-900 font-medium'>{alert.title}</span>
                    <span className='text-[11px] text-red-600'>({alert.distance_km} km away)</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setDismissed(true)}
              className='text-red-400 hover:text-red-600 text-lg leading-none mt-0.5'>
              &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertBanner
