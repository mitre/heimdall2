import Vue from "vue";
import Router from "vue-router";
import Results from "@/views/Results.vue";
import Compare from "@/views/Compare.vue";
import Landing from "@/views/Landing.vue";
import Auth from "@/views/Auth.vue";
import Login from "@/views/Login.vue";
import Signup from "@/views/Signup.vue";

Vue.use(Router);

export default new Router({
  mode: "history",
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
      path: "/",
      name: "home",
      component: Landing
    },
    /*
    {
      path: "/login",
      name: "Login",
      component: Login
    },
    */
    /*
    {
      path: "/about",
      name: "about",
      component: About
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      //component: () =>
      //import(/* webpackChunkName: "about"  "@/views/About.vue")
    },
    */
    {
      path: "/home",
      name: "home",
      component: Landing
    },
    {
      path: "/login",
      name: "login",
      component: Login
    },
    {
      path: "/signup",
      name: "signup",
      component: Signup
    },
    {
      path: "*",
      redirect: "/results/all"
    }
  ]
});
