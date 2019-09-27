import Vue from "vue";
import Router from "vue-router";
import Results from "@/views/Results.vue";
import Compare from "@/views/Compare.vue";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/results/:id",
      name: "results",
      component: Results
    },
    {
      path: "/compare",
      name: "compare",
      component: Compare
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () =>
        import(/* webpackChunkName: "about" */ "@/views/About.vue")
    },
    {
      path: "*",
      redirect: "/results/all"
    }
  ]
});
