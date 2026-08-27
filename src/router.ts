import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'

/**
 * 单文件预览版走 hash 路由：那个环境没有服务端，
 * 直接访问 /sentences 这种路径会 404。正常部署仍然是 History 路由。
 * 由 vite.standalone.config.ts 用 define 注入。
 */
declare const __THREEBODY_HASH_ROUTER__: boolean | undefined
const useHash =
  typeof __THREEBODY_HASH_ROUTER__ !== 'undefined' && __THREEBODY_HASH_ROUTER__

// 首页同步载入（它是 LCP 所在），其余三页按需分块
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '三体宇宙 · Threebody.space' },
  },
  {
    path: '/sentences',
    name: 'sentences',
    component: () => import('@/views/SentencesView.vue'),
    meta: { title: '书摘 423 条 · Threebody.space' },
  },
  {
    path: '/works',
    name: 'works',
    component: () => import('@/views/WorksView.vue'),
    meta: { title: '我的三体 · Threebody.space' },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: '关于 · Threebody.space' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: useHash ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = to.meta.title
  if (typeof title === 'string') document.title = title
})
