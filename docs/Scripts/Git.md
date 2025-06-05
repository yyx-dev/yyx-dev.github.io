# Git

## 版本管理

创建仓库

```shell
git init
```

添加查看删除配置

```shell
git config user.name "yourfriendyo" # 添加配置
git config user.email "3395537299@qq.com"

git config -l # 查看配置

git config --unset user.name # 删除配置
git config --unset user.email

git config --gloabl user.name "yourfriendyo" # 全局配置
git config --gloabl user.email "3395537299@qq.com"
```

添加管理

```shell
git add test.txt # 添加文件到暂存区
git add -f test.txt # 强制添加

git comit -m 'msg' # 提交暂存区到仓库
```

查看日志

```shell
git log --pretty=oneline # 查看提交日志
git log --graph # 图形化显示
git log --graph --abbrev-commit
git reflog

git cat-file -p

git status # 查看工作区状态

git diff test.txt # 查看文件内容变化
```

版本回退

```shell
git reset --soft  # 回退版本库
					--mixed # 回退版本库和暂存区 默认选项
					--hard  # 回退版本库、暂存区和工作区
							HEAD^
					
git checkout -- test.txt # 将工作区文件退回到上一次add或commit
```

删除文件
```shell
git rm test.txt # 删除工作区和暂存区文件
```

忽略文件

```shell
# .gitignore
*.a # 忽略所有以.a结尾的文件
!b.a # 不忽略b.a文件

git check-ignore -v test.txt # 检查文件是否忽略
```

给命令取别名

```shell
git config alias.st status # git st = git status
git config alias.lpa 'log --pretty=oneline --abbrev-commit'
```

&nbsp;

## 分支管理

查看分支

```shell
git branch
git branch -a
git branch -vv
```

创建分支

```shell
git branch dev
```

切换分支

```shell
git checkout dev
git checkout -b dev # 创建并切换分支
git checkout -b dev origin/dev # 创建并连接远程分支
```

合并分支

```shell
git merge dev
git merge --no-ff -m 'commit msg' dev
```

删除分支

```shell
git branch -d dev
git branch -D dev # 强制删除
```

暂存分支

```shell
git stash # 暂时存储
git stash list # 查看stash的内容
git stash pop # 
```

查看远端分支

```shell
git remote show origin
git remote prune origin
```

&nbsp;

## 远程操作

查看远程仓库

```shell
git remote
git remote -v
```

推送到远程仓库

```shell
git push origin master:master # 将本地master分支push到远程的master分支
git push origin master # 远程分支和本地分支同名，省略远程分支名
```

拉取远程仓库

```shell
git pull origin master:master
git pull origin master
```

链接远程分支

```shell
git branch --set-upstream-to=origin/dev dev
```

&nbsp;

## 标签管理

打标签

```shell
git tag v1.0 # 为当前版本打标签

git tag v1.0 2756a54 # 为特定版本打标签

git tag -a v0.8 -m 'important tag: xxxx' # 为标签添加描述信息
```

查看标签

```shell
git tag
```

查看标签版本内容

```shell
git show v1.0
```

删除标签

```shell
git tag -d v1.0
```

推送标签

```shell
git push origin v1.0

git push origin --tags # 推送所有标签

git push origin :v0.9 # 删除本地分支并推送到远程
```
