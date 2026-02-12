import { defineConfig } from 'vitepress'
import { menuItems } from '../util/menu'

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
      ...menuItems.map(item => ({
        text: item.text,
        items: item.items || []
      }))
    ],

    sidebar: menuItems,

    socialLinks: [
      { icon: 'gitee', link: 'https://gitee.com/yyx_dev' },
      { icon: 'github', link: 'https://github.com/yyx-dev' }
    ],

    search: {
      provider: "local",
      options: {
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
      copyright: 'Copyright@ 2026 Yang Yuxi. All rights reserved.',
    }
  },

  markdown: {
    math: true,
  }
})
