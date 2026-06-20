import { defineConfig } from "vitepress";
import { menu } from "./menu.mjs";
import lightbox from "vitepress-plugin-lightbox";
import container from "markdown-it-container";

export default defineConfig({
  base: "/",

  head: [["link", { rel: "icon", href: "/docs.png" }]],

  title: "杨宇曦的博客",
  description: "记录学习积累内容",

  themeConfig: {
    outlineTitle: "目录大纲",
    outline: [2, 3],

    nav: [{ text: "首页", link: "/" }, ...menu],

    sidebar: menu,

    socialLinks: [
      { icon: "github", link: "https://github.com/yyx-dev" },
      { icon: "gitee", link: "https://gitee.com/yyx_dev" },
    ],

    search: {
      provider: "local",
      options: {
        miniSearch: {
          options: {
            tokenize: (str: string) => str.split(/(?:)/u),
          },
          searchOptions: {
            prefix: true,
            fuzzy: 0.2,
            combineWith: "AND",
          },
        },
        translations: {
          button: {
            buttonText: "搜索文档",
            buttonAriaLabel: "搜索文档",
          },
          modal: {
            noResultsText: "无法找到相关结果",
            resetButtonTitle: "清除查询条件",
            footer: {
              selectText: "选择",
              navigateText: "切换",
            },
          },
        },
      },
    },

    footer: {
      copyright:
        "Released under the MIT License.<br>Copyright © 2020-present Yuxi Yang",
    },
  },

  markdown: {
    math: true,
    image: {
      lazyLoading: false,
    },
    config: (md) => {
      md.use(lightbox, {});
      md.use(container, "analysis", {
        validate: function (params) {
          return params.trim().match(/^analysis\s*(.*)$/);
        },
        render: function (tokens, idx) {
          const token = tokens[idx];
          const title = token.info.trim().slice("analysis".length).trim();

          if (token.nesting === 1) {
            return `<analysis title="${title}">`;
          } else {
            return `</analysis>`;
          }
        },
      });
    },
  },
});
