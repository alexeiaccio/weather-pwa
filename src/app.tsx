import { browserHistory, createRouter, defineRoutes } from '@solidjs/router'
import MainScreen from './screens/main-screen.tsx'
import Playground from './screens/playground.tsx'

const Router = createRouter({
  routes: defineRoutes([
    { path: '/', component: MainScreen },
    { path: '/playground', component: Playground },
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
