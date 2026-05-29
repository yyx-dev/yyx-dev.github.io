// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import emphasis from "./components/emphasis.vue";
import warning from "./components/warning.vue";
import number from "./components/number.vue"
import tip from "./components/tip.vue";
import add from "./components/add.vue";
import super_emphasis from "./components/super-emphasis.vue";
import super_warning from "./components/super-warning.vue";
import super_add from "./components/super-add.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router, siteData }) {
    app.component("emp", emphasis);
    app.component("warn", warning);
    app.component("tip", tip);
    app.component("add", add);
    app.component("semp", super_emphasis);
    app.component("swarn", super_warning);
    app.component("sadd", super_add);
    app.component("num", number);
  },
} satisfies Theme;
