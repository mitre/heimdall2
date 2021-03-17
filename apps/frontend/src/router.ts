import {AppInfoModule} from '@/store/app_info';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationModule} from '@/store/evaluations';
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
      meta: {requiresAuth: true, hasIdParams: true},
      children: [
        {
          path: ':id',
          component: Results,
          meta: {requiresAuth: true, hasIdParams: true}
        }
      ]
    },
    {
      path: '/compare',
      name: 'compare',
      component: Compare,
      meta: {requiresAuth: true, hasIdParams: true},
      children: [
        {
          path: ':id',
          component: Compare,
          meta: {requiresAuth: true, hasIdParams: true}
        }
      ]
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
      redirect: '/',
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
    if (to.params.id) {
      EvaluationModule.load_results(to.params.id.split(','));
    }
    const loadedDatabaseIds = InspecDataModule.allLoadedDatabaseIds.join(',');
    // For any URL that displays IDs of the currently loaded database files at the end of it
    // ensure that the URL bar is up to date with what files are currently loaded into the database
    // Don't try to add IDs to the URL when there are no files loaded from the database (for example: samples or local files)
    if (
      to.matched.some((record) => record.meta.hasIdParams) &&
      loadedDatabaseIds &&
      to.params.id !== loadedDatabaseIds
    ) {
      next({path: `${to.path}/${loadedDatabaseIds}`, replace: true});
      return;
    }
    next();
  });
});

export default router;
