# 快速开始指南

## Git 初始化步骤

### 第一步：安装 Git（如果未安装）

**方法1：官网下载（推荐）**
1. 访问 https://git-scm.com/download/win
2. 下载并运行安装程序
3. 安装时选择默认选项即可
4. **重要**：安装完成后**重启 PowerShell**

**方法2：使用 Winget（Windows 10/11）**
```powershell
winget install --id Git.Git -e --source winget
```
然后重启 PowerShell

**方法3：使用 Chocolatey（如果已安装）**
```powershell
choco install git
```

### 第二步：验证 Git 安装

打开新的 PowerShell 窗口，运行：
```powershell
git --version
```

如果显示版本号（如 `git version 2.43.0`），说明安装成功。

### 第三步：配置 Git（首次使用）

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 第四步：初始化项目仓库

在项目目录下运行：
```powershell
.\init-git.ps1
```

或者手动执行：
```powershell
git init
git add .
git commit -m "chore: 初始化项目"
```

## 如果遇到问题

### 问题1：提示 "git 无法识别"

**解决方案：**
1. 确认 Git 已正确安装
2. **重启 PowerShell 窗口**（重要！）
3. 如果仍不行，检查 PATH 环境变量是否包含 Git 路径

### 问题2：提示 "权限被拒绝"

**解决方案：**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 问题3：Git 命令执行缓慢

**解决方案：**
可能是杀毒软件扫描导致，可以：
- 将项目目录添加到杀毒软件白名单
- 或暂时禁用实时保护

## 替代方案

如果无法安装 Git，可以使用：

1. **GitHub Desktop**（图形界面）
   - https://desktop.github.com/
   - 安装后可以直接通过界面初始化仓库

2. **VS Code Git 集成**
   - 打开项目文件夹
   - 点击左侧源代码管理图标
   - 点击"初始化仓库"

## 下一步

初始化完成后，可以：
- 查看状态：`git status`
- 查看历史：`git log`
- 添加远程仓库：`git remote add origin <url>`

更多信息请查看 `GIT_SETUP.md` 文件。
