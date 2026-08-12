// https://vitepress.dev/guide/custom-theme
import { h } from "vue";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import add from "./components/add.vue";
import analysis from "./components/analysis.vue";
import emphasis from "./components/emphasis.vue";
import stress from "./components/stress.vue";
import mono from "./components/mono.vue";
import number from "./components/number.vue";
import options from "./components/options.vue";
import question from "./components/question.vue";
import super_add from "./components/super-add.vue";
import super_emphasis from "./components/super-emphasis.vue";
import super_warning from "./components/super-warning.vue";
import syllabus from "./components/syllabus.vue";
import table_head from "./components/table-head.vue";
import tip from "./components/tip.vue";
import warning from "./components/warning.vue";

import Layout from "./components/layout.vue";

import "./style.css";
import "./feature.css";
import "./perfect-list.css";
import "./used-in-v1.6.4.css"

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.component("add", add);
    app.component("analysis", analysis);
    app.component("emp", emphasis);
    app.component("stress", stress);
    app.component("mono", mono);
    app.component("num", number);
    app.component("options", options);
    app.component("question", question);
    app.component("syllabus", syllabus);
    app.component("sadd", super_add);
    app.component("semp", super_emphasis);
    app.component("swarn", super_warning);
    app.component("thd", table_head);
    app.component("tip", tip);
    app.component("warn", warning);
  },
} satisfies Theme;
