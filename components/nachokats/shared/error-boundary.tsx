'use client'

import { Component, ReactNode } from 'react'
import Card from './card'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200">
          <div className="flex items-center space-x-3 text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Something went wrong</h3>
              <p className="text-sm text-red-500">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
} 