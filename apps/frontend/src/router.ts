import {AppInfoModule} from '@/store/app_info';
import {ServerModule} from '@/store/server';
import Admin from '@/views/Admin.vue';
import Compare from '@/views/Compare.vue';
import Groups from '@/views/Groups.vue';
import Landing from '@/views/Landing.vue';
import Login from '@/views/Login.vue';
import Results from '@/views/Results.vue';
import Signup from '@/views/Signup.vue';
import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/results',
      name: 'results',
      component: Results,
      alias: '/profiles',
      meta: {requiresAuth: true},
      children: [
        {
          path: ':id',
          component: Results,
          alias: ':id',
          meta: {requiresAuth: true}
        }
      ]
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
      path: '/manage-groups',
      name: 'groups',
      component: Groups,
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
      path: '/admin',
      name: 'admin',
      component: Admin,
      meta: {requiresAuth: true, requiresAdmin: true}
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
    AppInfoModule.CheckForUpdates();
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (ServerModule.serverMode && !ServerModule.token) {
        next('/login');
        return;
      }
    }
    if (to.matched.some((record) => record.meta.requiresAdmin)) {
      if (ServerModule.userInfo.role !== 'admin') {
        next('/');
        return;
      }
    }
    next();
  });
});

export default router;
