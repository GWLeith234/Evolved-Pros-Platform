'use client'

/* DIAGNOSTIC — WILL REVERT after #425/#422 root cause confirmed.
   Sprint P: wraps the (member) layout children with a React error boundary
   that logs `error.message` and `componentStack` to the browser console on
   any render-time / hydration error. The componentStack carries human-
   readable component names even in production (Next preserves displayName
   in App Router builds), so one QA pass on /community and /events surfaces
   the exact subtree throwing #425/#422. */

import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  caught: boolean
}

export class HydrationDiag extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { caught: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[HYDRATION-DIAG] error:', error.message)
    console.error('[HYDRATION-DIAG] componentStack:', info.componentStack)
  }

  render() {
    return this.props.children
  }
}
