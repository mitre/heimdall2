import './assets/css/main.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import Home from './views/Home.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    }
  ]
})

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.use(ui)

app.mount('#app')
