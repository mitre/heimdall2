import Vue from 'vue';
import Router from 'vue-router';
import Results from '@/views/Results.vue';
import Compare from '@/views/Compare.vue';
import Landing from '@/views/Landing.vue';
import Login from '@/views/Login.vue';
import Signup from '@/views/Signup.vue';

import {ServerModule} from '@/store/server';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/results',
      name: 'results',
      component: Results,
      meta: {requiresAuth: true}
    },
    {
      path: '/compare',
      name: 'compare',
      component: Compare,
      meta: {requiresAuth: true}
    },
    {
      path: '/',
      name: 'home',
      component: Landing,
      meta: {requiresAuth: true}
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/signup',
      name: 'signup',
      component: Signup
    },
    {
      path: '*',
      redirect: '/results/all',
      meta: {requiresAuth: true}
    }
  ]
});

router.beforeEach((to, _, next) => {
  ServerModule.CheckForServer().then(() => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (ServerModule.serverMode && !ServerModule.token) {
        next('/login');
        return;
      }
    }
    next();
  });
});

export default router;
