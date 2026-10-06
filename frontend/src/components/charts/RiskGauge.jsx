import { motion } from 'framer-motion'
import { tierHex } from '../../utils/helpers'

export default function RiskGauge({ score = 0, tier = 'low', size = 200 }) {
  const strokeW = size * 0.08
  const radius = (size - strokeW) / 2 - 10 // extra padding for glow
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(score / 10, 1)
  const offset = circumference * (1 - pct)
  
  // Custom modern gradients based on tier
  const gradients = {
    low: ['#60a5fa', '#3b82f6'],
    medium: ['#fbbf24', '#f59e0b'],
    high: ['#fb923c', '#ea580c'],
    critical: ['#f87171', '#dc2626']
  }
  
  const [colorStart, colorEnd] = gradients[tier] || gradients.low

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-xl">
        <defs>
          <linearGradient id={`gradient-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <filter id={`glow-${tier}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeW}
          className="text-slate-100 dark:text-slate-800"
        />

        {/* Progress Arc */}
        <motion.circle
          cx={cx} cy={cy} r={radius}
          fill="none" 
          stroke={`url(#gradient-${tier})`} 
          strokeWidth={strokeW} 
          strokeLinecap="round"
          strokeDasharray={circumference}
          filter={`url(#glow-${tier})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Inner Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white"
        >
          {Number(score).toFixed(1)}
        </motion.span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">out of 10</span>
      </div>
    </div>
  )
}
