import "jest";
import Vue from "vue";
import Vuetify from "vuetify";
import UploadNexus from "@/components/global/UploadNexus.vue";
import { getModule } from "vuex-module-decorators";

import { mount, shallowMount, Wrapper } from "@vue/test-utils";
import ServerModule from "@/store/server";

const vuetify = new Vuetify();
let wrapper: Wrapper<Vue>;
let mod = getModule(ServerModule);

beforeEach(() => {
  localStorage.setItem("auth_token", JSON.stringify("dummy-token"));

  wrapper = shallowMount(UploadNexus, {
    vuetify,
    propsData: {
      persistent: true,
      value: true
    }
  });
});

describe("UploadNexus.vue", () => {
  it("Set token module works", () => {
    mod.set_token("dummy-token");
    expect(mod.token).toBe("dummy-token");
  });

  it("Server mode module check", () => {
    process.env.VUE_APP_API_URL = "testurl";
    mod.server_mode();
    expect(mod.serverMode).toBe(true);
  });

  it("Logout button exist when logged in", async () => {
    process.env.VUE_APP_API_URL = "test";
    mod.server_mode();
    //await wrapper.vm.$nextTick()
    expect(wrapper.find("#logout").exists()).toBe(true);
  });

  it("Logout button doesn't exist when logged out", async () => {
    mod.clear_token();
    process.env.VUE_APP_API_URL = "test";
    await wrapper.vm.$nextTick();
    expect(wrapper.find("#logout").exists()).toBe(false);
  });
});
