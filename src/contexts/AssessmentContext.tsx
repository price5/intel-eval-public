import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './AuthContext'

interface AssessmentContextType {
  isAssessmentActive: boolean
  currentAssessmentId: string | null
  completedAssessments: Set<string>
  startAssessment: (assessmentId: string) => void
  endAssessment: () => void
  confirmNavigation: () => Promise<boolean>
  forceEndAssessment: () => void
  markAssessmentCompleted: (assessmentId: string) => void
  checkIfCompleted: (assessmentId: string) => Promise<boolean>
  loadingCompletedAssessments: boolean
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined)

export const useAssessment = () => {
  const context = useContext(AssessmentContext)
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider')
  }
  return context
}

interface AssessmentProviderProps {
  children: React.ReactNode
}

export const AssessmentProvider: React.FC<AssessmentProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [isAssessmentActive, setIsAssessmentActive] = useState(false)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null)
  const [completedAssessments, setCompletedAssessments] = useState<Set<string>>(new Set())
  const [loadingCompletedAssessments, setLoadingCompletedAssessments] = useState(true)

  // Load completed assessments from database on mount
  useEffect(() => {
    const loadCompletedAssessments = async () => {
      if (!user) {
        setLoadingCompletedAssessments(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('assessment_submissions')
          .select('assessment_id')
          .eq('student_id', user.id)
          .eq('status', 'completed')

        if (error) throw error

        const completed = new Set(data?.map(sub => sub.assessment_id) || [])
        setCompletedAssessments(completed)
      } catch (error) {
        console.error('Error loading completed assessments:', error)
      } finally {
        setLoadingCompletedAssessments(false)
      }
    }

    loadCompletedAssessments()
  }, [user])

  const checkIfCompleted = async (assessmentId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { data, error } = await supabase
        .from('assessment_submissions')
        .select('id')
        .eq('assessment_id', assessmentId)
        .eq('student_id', user.id)
        .eq('status', 'completed')
        .limit(1)

      if (error) throw error
      return (data?.length || 0) > 0
    } catch (error) {
      console.error('Error checking if assessment completed:', error)
      return false
    }
  }

  const startAssessment = (assessmentId: string) => {
    setIsAssessmentActive(true)
    setCurrentAssessmentId(assessmentId)
  }

  const endAssessment = () => {
    if (currentAssessmentId) {
      setCompletedAssessments(prev => new Set([...prev, currentAssessmentId]))
    }
    setIsAssessmentActive(false)
    setCurrentAssessmentId(null)
  }

  const forceEndAssessment = () => {
    setIsAssessmentActive(false)
    setCurrentAssessmentId(null)
  }

  const markAssessmentCompleted = (assessmentId: string) => {
    setCompletedAssessments(prev => new Set([...prev, assessmentId]))
  }

  const confirmNavigation = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isAssessmentActive) {
        resolve(true)
        return
      }

      const userConfirmed = window.confirm(
        '⚠️ WARNING: Leaving this page will CANCEL your current assessment and it will NOT be saved or submitted.\n\nYour progress will be lost. Do you want to continue?'
      )
      
      if (userConfirmed) {
        // User confirmed - cancel and invalidate the assessment
        forceEndAssessment()
        resolve(true)
      } else {
        // User cancelled - stay on assessment
        resolve(false)
      }
    })
  }

  const value: AssessmentContextType = {
    isAssessmentActive,
    currentAssessmentId,
    completedAssessments,
    startAssessment,
    endAssessment,
    confirmNavigation,
    forceEndAssessment,
    markAssessmentCompleted,
    checkIfCompleted,
    loadingCompletedAssessments,
  }

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  )
}