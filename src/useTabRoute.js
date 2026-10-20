import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// "Organizer Approvals" -> "organizer-approvals"
export const slugify = (label) =>
  String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/**
 * Keeps a dashboard's current tab in the URL.
 *   base       "/volunteer"
 *   tabs       every valid tab value, e.g. ['Dashboard', 'Reports']
 *   defaultTab the tab shown at "/volunteer"
 * Returns [tab, setTab] - the same shape as useState, so existing code
 * (setActiveTab('Reports')) keeps working but now changes the address bar.
 */
export function useTabRoute(base, tabs, defaultTab) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const slug = pathname.slice(base.length).split('/').filter(Boolean)[0] || ''
  const match = tabs.find((tab) => slugify(tab) === slug)
  const tab = match || defaultTab

  // "/volunteer" or an unknown "/volunteer/xyz" -> tidy up to the default tab's URL.
  useEffect(() => {
    if (!match) navigate(`${base}/${slugify(defaultTab)}`, { replace: true })
  }, [match, base, defaultTab, navigate])

  const setTab = useCallback(
    (next) => navigate(`${base}/${slugify(next)}`),
    [base, navigate],
  )

  return [tab, setTab]
}
