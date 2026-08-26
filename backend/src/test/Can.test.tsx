import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '../store/useAuthStore'
import Can from '../router/Can'

const renderWithPerm = (permissions: string[], perm: string, text: string) => {
  useAuthStore.setState({
    user: { id: 1, username: '10000', name: '管理员', roles: [], permissions },
    token: 't'
  })
  return render(
    <Can perm={perm}>
      <button>{text}</button>
    </Can>
  )
}

describe('Can 权限按钮组件', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, token: null })
  })

  it('有权限时渲染子元素', () => {
    renderWithPerm(['product:write'], 'product:write', '新增产品')
    expect(screen.getByRole('button', { name: '新增产品' })).toBeInTheDocument()
  })

  it('无权限时不渲染子元素', () => {
    renderWithPerm(['product:read'], 'product:write', '新增产品')
    expect(screen.queryByRole('button', { name: '新增产品' })).not.toBeInTheDocument()
  })

  it('未登录（无权限列表）时不渲染', () => {
    render(
      <Can perm="stats:read">
        <button>工作台</button>
      </Can>
    )
    expect(screen.queryByRole('button', { name: '工作台' })).not.toBeInTheDocument()
  })
})
