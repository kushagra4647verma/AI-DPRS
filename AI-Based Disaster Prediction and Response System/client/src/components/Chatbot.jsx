import { useEffect } from 'react'

function Chatbot() {
  useEffect(() => {
    const loadScripts = () => {
      const s1 = document.createElement('script')
      s1.src = "https://cdn.botpress.cloud/webchat/v5.0/inject.js"
      s1.async = true
      s1.onload = () => {
        const s2 = document.createElement('script')
        s2.src = "https://files.bpcontent.cloud/2026/08/05/13/20260805130845-THX4AK4G.js"
        s2.defer = true
        document.body.appendChild(s2)
      }
      s1.onerror = () => console.warn('Chatbot failed to load')
      document.body.appendChild(s1)
    }

    const timer = setTimeout(loadScripts, 2000)
    return () => clearTimeout(timer)
  }, [])

  return null
}

export default Chatbot
