'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

class HydrationErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      '[HydrationDiag] caught:',
      error.message,
      '\ncomponentStack:',
      info.componentStack
    )
  }

  render() {
    return this.props.children
  }
}

export default HydrationErrorBoundary
