import { useNavigate } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Container className="py-20">
      <EmptyState
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={<Button onClick={() => navigate('/')}>Back home</Button>}
      />
    </Container>
  )
}
