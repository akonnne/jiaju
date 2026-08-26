import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../store/useAuthStore'

/** 权限守卫：当前用户缺少 perm 权限点 → 跳转 /403。 */
export default function RequirePerm({ perm, children }: { perm: string; children: ReactNode }) {
  const hasPerm = useAuthStore((s) => s.hasPerm)
  if (!hasPerm(perm)) {
    return <Navigate to="/403" replace />
  }
  return <>{children}</>
}
