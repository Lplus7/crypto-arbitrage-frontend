import { useState, useEffect } from 'react'
import axios from 'axios'
import { Wifi, WifiOff } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'

export default function ExchangeStatus() {
  const [exchanges, setExchanges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/exchanges`)
      setExchanges(response.data.exchanges)
    } catch (error) {
      console.error('Failed to fetch exchange status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-20 h-6 bg-slate-200 rounded animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {exchanges.map((exchange) => (
        <div
          key={exchange.name}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            exchange.connected
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {exchange.connected ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          {exchange.display_name}
        </div>
      ))}
    </div>
  )
}
