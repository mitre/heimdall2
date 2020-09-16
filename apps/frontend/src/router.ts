import Vue from 'vue';
import Router from 'vue-router';
import Results from '@/views/Results.vue';
import Compare from '@/views/Compare.vue';
import Landing from '@/views/Landing.vue';
import Profile from '@/views/Profile.vue';
import Login from '@/views/Login.vue';
import Signup from '@/views/Signup.vue';

import {BackendModule} from './store/backend';

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
      path: '/profile',
      name: 'profile',
      component: Profile,
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
  BackendModule.CheckForServer().then(() => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (BackendModule.serverMode && !BackendModule.token) {
        next('/login');
        return;
      }
    }
    next();
  });
});

export default router;
