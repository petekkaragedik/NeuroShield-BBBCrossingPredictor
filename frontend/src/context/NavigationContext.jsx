import { createContext, useCallback, useContext, useReducer, useRef } from 'react'

const NavCtx = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'PUSH': {
      const base = state.stack.slice(0, state.cursor + 1)
      const newStack = [...base, action.entry].slice(-50)
      return { stack: newStack, cursor: newStack.length - 1, pendingRestore: null }
    }
    case 'BACK': {
      if (state.cursor <= 0) return state
      const nc = state.cursor - 1
      return { ...state, cursor: nc, pendingRestore: { ...state.stack[nc].snapshot, _dir: 'back' } }
    }
    case 'FORWARD': {
      if (state.cursor >= state.stack.length - 1) return state
      const nc = state.cursor + 1
      return { ...state, cursor: nc, pendingRestore: { ...state.stack[nc].snapshot, _dir: 'forward' } }
    }
    case 'CLEAR_RESTORE':
      return { ...state, pendingRestore: null }
    default:
      return state
  }
}

export function NavigationProvider({ children }) {
  const [nav, dispatch] = useReducer(reducer, { stack: [], cursor: -1, pendingRestore: null })
  const navRef = useRef(nav)
  navRef.current = nav

  const push = useCallback((label, snapshot) => {
    dispatch({ type: 'PUSH', entry: { label, snapshot } })
  }, [])

  const goBack = useCallback(() => dispatch({ type: 'BACK' }), [])
  const goForward = useCallback(() => dispatch({ type: 'FORWARD' }), [])
  const clearPendingRestore = useCallback(() => dispatch({ type: 'CLEAR_RESTORE' }), [])

  const { stack, cursor, pendingRestore } = nav
  const canGoBack = cursor > 0
  const canGoForward = cursor < stack.length - 1

  return (
    <NavCtx.Provider value={{
      push,
      goBack,
      goForward,
      clearPendingRestore,
      canGoBack,
      canGoForward,
      backLabel: canGoBack ? stack[cursor - 1]?.label : null,
      forwardLabel: canGoForward ? stack[cursor + 1]?.label : null,
      pendingRestore,
    }}>
      {children}
    </NavCtx.Provider>
  )
}

export function useNavigation() {
  return useContext(NavCtx)
}
