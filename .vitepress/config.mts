import { defineConfig } from "vitepress";
import { withPwa } from '@vite-pwa/vitepress';
import { menu } from "./menu.mts";
import { perfectList } from './perfect-list.mts'
import lightbox from "vitepress-plugin-lightbox";
import container from "markdown-it-container";

export default withPwa(defineConfig({
  base: "/",
  cacheDir: '.vitepress/cache',
  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
    ["meta", { name: "mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }],
    ["meta", { name: "apple-mobile-web-app-title", content: "杨宇曦的博客" }],
  ],

  // lang: 'zh-Hans',
  // useWebFonts: true,

  title: "杨宇曦的博客",
  description: "记录学习积累内容",

  themeConfig: {
    outline: {
      label: "目录大纲",
      level: [2, 3],
    },

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
      md.use(container, "question", {
        validate: (params: string) => params.trim() === 'question',
        render: function (tokens: any[], idx: number) {
          const token = tokens[idx];
          if (token.nesting === 1) {
            return `<question>\n`;
          } else {
            return `</question>\n`;
          }
        },
      });
      md.use(container, "analysis", {
        validate: (params: string) => params.trim().match(/^analysis\s*(.*)$/),
        render: (tokens: any[], idx: number) => {
          const token = tokens[idx];
          const title = token.info.trim().slice("analysis".length).trim();
          if (token.nesting === 1) {
            return `<analysis title="${title}">\n`;
          } else {
            return `</analysis>\n`;
          }
        },
      });
      md.use(container, "answer", {
        validate: (params: string) => params.trim().match(/^answer\s*(.*)$/),
        render: (tokens: any[], idx: number) => {
          const token = tokens[idx];
          if (token.nesting === 1) {
            return `<analysis title="答案">\n`;
          } else {
            return `</analysis>\n`;
          }
        },
      });
      md.use(container, "stress", {
        validate: (params: string) => {
          if (!params) return false;
          return String(params).trim().startsWith('stress');
        },
        render: (tokens: any[], idx: number) => {
          const token = tokens[idx];

          if (token.nesting === 1) {
            const info = token.info ? String(token.info).trim() : '';
            const parts = info.split(/\s+/);

            let label = '';
            let title = '';
            let nobg = false;

            for (let i = 1; i < parts.length; i++) {
              const part = parts[i];
              if (part === 'nobg') {
                nobg = true;
              } else if (!label) {
                label = part;
              } else {
                title += (title ? ' ' : '') + part;
              }
            }

            return `<stress label="${label}" title="${title}" :nobg="${nobg}">\n`;
          } else {
            return `</stress>\n`;
          }
        },
      });
      md.use(perfectList);
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '杨宇曦的博客',
      short_name: '408博客',
      description: '杨宇曦的博客 - 记录学习积累内容',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },

    workbox: {
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,svg,ico,png,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'assets-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60 // 30days
            }
          }
        }
      ]
    },
  },
}));
