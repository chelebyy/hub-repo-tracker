import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Please try reloading the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-md bg-muted/50 border text-sm font-mono break-all text-muted-foreground">
                {this.state.error?.message || 'Unknown error'}
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
