import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/**
 * Catches render errors so a failed chunk or bug shows a message instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-rose-50 px-6 text-center text-slate-800">
          <p className="text-lg font-semibold">Something went wrong loading this page.</p>
          <p className="max-w-md text-sm text-slate-600">
            Try refreshing. If it keeps happening, check that the site was deployed from the latest build (GitHub
            Actions → Deploy to GitHub Pages).
          </p>
          <button
            type="button"
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-bold text-white shadow-md"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
