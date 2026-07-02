import Vue from 'vue';
import Router from 'vue-router';
import { AppInfoModule } from '@/store/app_info';
import { InspecDataModule } from '@/store/data_store';
import { EvaluationModule } from '@/store/evaluations';
import { ServerModule } from '@/store/server';
import { confirm } from '@/utilities/confirm_service';
import Admin from '@/views/Admin.vue';
import Compare from '@/views/Compare.vue';
import Groups from '@/views/Groups.vue';
import Landing from '@/views/Landing.vue';
import Login from '@/views/Login.vue';
import Results from '@/views/Results.vue';
import Signup from '@/views/Signup.vue';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      alias: '/profiles',
      children: [
        {
          component: Results,
          meta: { hasIdParams: true, requiresAuth: true },
          path: ':id',
        },
      ],
      component: Results,
      meta: { hasIdParams: true, requiresAuth: true },
      name: 'results',
      path: '/results',
    },
    {
      children: [
        {
          component: Compare,
          meta: { hasIdParams: true, requiresAuth: true },
          path: ':id',
        },
      ],
      component: Compare,
      meta: { hasIdParams: true, requiresAuth: true },
      name: 'compare',
      path: '/compare',
    },
    {
      component: Landing,
      meta: { requiresAuth: true },
      name: 'home',
      path: '/',
    },
    {
      component: Groups,
      meta: { requiresAuth: true },
      name: 'groups',
      path: '/manage-groups',
    },
    {
      component: Login,
      name: 'login',
      path: '/login',
    },
    {
      component: Signup,
      name: 'signup',
      path: '/signup',
    },
    {
      component: Admin,
      meta: { requiresAdmin: true, requiresAuth: true },
      name: 'admin',
      path: '/admin',
    },
    {
      meta: { requiresAuth: true },
      path: '*',
      redirect: '/',
    },
  ],
});

router.beforeEach((to, from, next) => {
  ServerModule.CheckForServer().then(async () => {
    AppInfoModule.CheckForUpdates();
    if (to.matched.some(record => record.meta.requiresAuth) && ServerModule.serverMode && !ServerModule.token) {
      next('/login');
      return;
    }
    if (to.matched.some(record => record.meta.requiresAdmin) && ServerModule.userInfo.role !== 'admin') {
      next('/');
      return;
    }

    if (
      InspecDataModule.hasUnsavedFiles
      && from.path !== to.path
    ) {
      const discard = await confirm({
        cancelText: 'Stay',
        confirmText: 'Discard',
        message:
          'You have unsaved attestations or comments. '
          + 'Leaving this page will discard them.',
        title: 'Unsaved Changes',
      });
      if (!discard) {
        next(false);
        return;
      }
      InspecDataModule.clearDirtyFiles();
    }

    if (to.params.id && to.params.id !== 'all') {
      EvaluationModule.load_results(to.params.id.split(','));
    }
    const loadedDatabaseIds = InspecDataModule.loadedDatabaseIds.join(',');
    if (
      to.matched.some(record => record.meta.hasIdParams)
      && loadedDatabaseIds
      && to.params.id !== loadedDatabaseIds
    ) {
      next({
        path: `/${to.path.split('/')[1]}/${loadedDatabaseIds}`,
        replace: true,
      });
      return;
    }
    next();
  });
});

export default router;
