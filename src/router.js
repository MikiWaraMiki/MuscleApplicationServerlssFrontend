import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import MyPage from './views/Mypage.vue'
import Timeline from './views/Timeline.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: MyPage
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: Timeline
    }
  ]
})
