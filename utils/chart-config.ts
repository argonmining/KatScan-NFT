import { Theme } from 'recharts'

export const chartTheme: Theme = {
  colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
  backgroundColor: '#ffffff',
  fontFamily: 'Inter var, sans-serif',
  fontSize: 12,
  axis: {
    domain: {
      line: {
        stroke: '#E5E7EB',
        strokeWidth: 1
      }
    },
    tick: {
      line: {
        stroke: '#9CA3AF',
        strokeWidth: 1
      }
    },
    text: {
      fill: '#6B7280'
    }
  },
  grid: {
    line: {
      stroke: '#F3F4F6',
      strokeWidth: 1
    }
  },
  legend: {
    text: {
      fill: '#374151'
    }
  }
}

export const tooltipStyle = {
  background: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  padding: '0.75rem',
  fontSize: '0.875rem'
}

export const chartAnimationConfig = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
} 