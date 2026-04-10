import { redirect } from 'next/navigation'
import { getPlanById } from '@/lib/db'
import { PlanView } from '@/components/plan/PlanView'

interface PlanPageProps {
  params: Promise<{ id: string }>
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params
  const plan = await getPlanById(id)

  if (!plan) redirect('/')

  return <PlanView initialPlan={plan} />
}
