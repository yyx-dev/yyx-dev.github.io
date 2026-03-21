import { defineConfig } from 'vitepress'
import { menu } from './menu.mjs'

export default defineConfig({
  base: '/',

  head: [
    [ "link", { rel: "icon", href: "/docs.png" }],
  ],

  title: "杨宇曦的博客",
  description: "记录学习积累内容",

  themeConfig: {

    outlineTitle: '目录大纲',
    outline: [2,3],

    nav: [
      { text: '首页', link: '/' },
      ...menu,
    ],

    sidebar: menu,

    socialLinks: [
      { icon: 'gitee', link: 'https://gitee.com/yyx_dev' },
      { icon: 'github', link: 'https://github.com/yyx-dev' }
    ],

    search: {
      provider: "local",
      options: {
        miniSearch: {
          options: {
            tokenize: (str) => str.split(/(?:)/u), 
          },
          searchOptions: {
            prefix: true,
            fuzzy: 0.2,
            combineWith: 'AND' 
          }
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
      copyright: 'Released under the MIT License.<br>Copyright © 2020-present Yuxi Yang',
    }
  },

  markdown: {
    math: true,
  }
})


