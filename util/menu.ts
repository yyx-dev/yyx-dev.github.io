import type { DefaultTheme } from 'vitepress'
import fs from 'fs'
import path from 'path'

// 定义 menuItems 的类型
type MenuItem = DefaultTheme.SidebarItem & {
  text: string
  items?: { text: string; link: string }[]
}

// 动态生成 menuItems
export const menuItems: MenuItem[] = (() => {
  const docsDir = path.resolve(__dirname, '../docs') // docs 文件夹路径
  const folders = fs
    .readdirSync(docsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.')) // 过滤隐藏文件夹
    .map(dirent => dirent.name)
    .filter(folder => folder !== 'public' && !folder.endsWith('.assets')) // 排除 public 和 .assets 文件夹

  const menuItems: MenuItem[] = folders.map(folder => {
    const folderPath = path.join(docsDir, folder)
    const files = fs
      .readdirSync(folderPath)
      .filter(file => file.endsWith('.md')) // 仅保留 .md 文件
      .map(file => {
        const fileName = file.replace(/\.md$/, '') // 去掉 .md 扩展名
        return {
          text: fileName,
          link: `/docs/${folder}/${fileName}`
        }
      })

    return {
      text: folder,
      items: files
    }
  })

  return menuItems
})()