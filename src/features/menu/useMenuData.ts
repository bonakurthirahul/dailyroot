import { useCallback, useEffect, useState } from 'react'
import { fetchCategories, fetchMenuTree } from '../../services/menu'
import type { Category, MenuTreeItem } from '../../types/db'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface MenuData {
  status: LoadStatus
  items: MenuTreeItem[]
  categories: Category[]
  error: string | null
  reload: () => void
}

export function useMenuData(): MenuData {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [items, setItems] = useState<MenuTreeItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError(null)

    Promise.all([fetchMenuTree(), fetchCategories()])
      .then(([menuItems, categoryList]) => {
        if (!active) return
        setItems(menuItems)
        setCategories(categoryList)
        setStatus('ready')
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : 'Unable to load menu')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  return { status, items, categories, error, reload }
}
