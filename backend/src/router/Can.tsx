import type { ReactNode } from 'react'
import { useAuthStore } from '../store/useAuthStore'

/** 按钮级权限控制：无 perm 权限 → 不渲染 children（返回 null）。 */
export default function Can({ perm, children }: { perm: string; children: ReactNode }) {
  const hasPerm = useAuthStore((s) => s.hasPerm)
  if (!hasPerm(perm)) {
    return null
  }
  return <>{children}</>
}
