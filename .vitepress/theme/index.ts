// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import add from "./components/add.vue";
import adjunct from "./components/adjunct.vue";
import emphasis from "./components/emphasis.vue";
import mono from "./components/mono.vue";
import number from "./components/number.vue"
import super_add from "./components/super-add.vue";
import super_emphasis from "./components/super-emphasis.vue";
import super_warning from "./components/super-warning.vue";
import tip from "./components/tip.vue";
import warning from "./components/warning.vue";

import Layout from "./components/layout.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.component("add", add);
    app.component("adj", adjunct);
    app.component("emp", emphasis);
    app.component("mono", mono);
    app.component("num", number);
    app.component("sadd", super_add);
    app.component("semp", super_emphasis);
    app.component("swarn", super_warning);
    app.component("tip", tip);
    app.component("warn", warning);
  },
} satisfies Theme;
