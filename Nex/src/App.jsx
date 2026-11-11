import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'

import { store } from './app/store.js'
import { router } from './app/router.jsx'
import { startSessionBridge } from './app/sessionBridge.js'

import { ToastViewport } from './components/common/Toast.jsx'

// Keep the storefront's local session view in sync with the shared
// auth store (see src/app/sessionBridge.js).
startSessionBridge(store)

export default function App() {
  return (
    <Provider store={store}>
      <RouterProvider
        router={router}
      />

      <ToastViewport />
    </Provider>
  )
}