import { browserHistory, createRouter, defineRoutes } from '@solidjs/router'
import MainScreen from './screens/main-screen.tsx'

const Router = createRouter({
  routes: defineRoutes([
    { path: '/', component: MainScreen },
    { path: '/*', component: MainScreen },
  ]),
  history: browserHistory(),
})

export default function App() {
  return (
    <div class="h-full">
      <Router>{(root) => root.children}</Router>
    </div>
  )
}
