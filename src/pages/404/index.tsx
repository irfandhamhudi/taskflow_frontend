'use client';
import { Button } from "../../components/ui/button" 
import { useNavigate } from "react-router-dom";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "../../components/ui/empty"


export function EmptyInputGroup() {
  const router = useNavigate()

  const handleNavigateToDashboard = () => {
    router('/dashboard')
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="text-5xl w-full">404 - Not Found</EmptyTitle>
          <EmptyDescription className="text-sm">
            The page you&apos;re looking for doesn&apos;t exist. Try searching for
            what you need below or go back to the dashboard.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex flex-col gap-6">
          <Button className="cursor-pointer" onClick={handleNavigateToDashboard} size="lg">
            Go to Dashboard
          </Button>

          <EmptyDescription className="text-center">
            Need help? <a href="#" className="underline hover:text-primary">Contact support</a>
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    </div>
  )
}