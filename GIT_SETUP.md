# Git 安装和配置指南

## 问题诊断

当前系统无法识别 `git` 命令，说明 Git 未安装或未添加到系统 PATH 环境变量中。

## 解决方案

### 方案一：安装 Git for Windows（推荐）

1. **下载 Git for Windows**
   - 访问：https://git-scm.com/download/win
   - 或使用国内镜像：https://mirrors.tuna.tsinghua.edu.cn/git-for-windows/

2. **安装步骤**
   - 运行下载的安装程序（如 `Git-2.x.x-64-bit.exe`）
   - 安装过程中注意：
     - ✅ 选择 "Git from the command line and also from 3rd-party software"
     - ✅ 选择 "Use bundled OpenSSH"
     - ✅ 选择 "Use the OpenSSL library"
     - ✅ 选择 "Checkout Windows-style, commit Unix-style line endings"
     - ✅ 选择 "Use MinTTY"
     - ✅ 选择 "Enable file system caching"

3. **验证安装**
   打开新的 PowerShell 窗口，运行：
   ```powershell
   git --version
   ```
   如果显示版本号（如 `git version 2.x.x`），说明安装成功。

4. **配置 Git（首次使用）**
   ```powershell
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### 方案二：使用 Chocolatey 安装（如果已安装 Chocolatey）

```powershell
choco install git
```

### 方案三：使用 Winget 安装（Windows 10/11）

```powershell
winget install --id Git.Git -e --source winget
```

## 安装后初始化项目

安装完 Git 后，在项目目录下运行：

```powershell
# 方式1：使用提供的脚本
.\init-git.ps1

# 方式2：手动执行
git init
git add .
git commit -m "chore: 初始化项目"
```

## 如果暂时无法安装 Git

如果暂时无法安装 Git，可以：

1. **使用 GitHub Desktop**（图形化界面）
   - 下载：https://desktop.github.com/
   - 安装后可以直接通过图形界面初始化仓库

2. **使用 VS Code 的 Git 集成**
   - VS Code 内置 Git 支持
   - 打开项目后，点击左侧源代码管理图标
   - 点击"初始化仓库"按钮

3. **手动创建 Git 仓库结构**（不推荐）
   - 可以手动创建 `.git` 目录结构
   - 但这种方式容易出错，建议使用工具

## 常见问题

### Q: 安装后仍然无法识别 git 命令？

**A:** 需要重启 PowerShell 或命令提示符窗口，让系统重新加载 PATH 环境变量。

### Q: 如何检查 Git 是否已安装？

**A:** 运行以下命令：
```powershell
Get-Command git -ErrorAction SilentlyContinue
```
如果有输出，说明已安装。

### Q: Git 安装路径在哪里？

**A:** 默认安装路径通常是：
- `C:\Program Files\Git\cmd\git.exe`
- `C:\Program Files (x86)\Git\cmd\git.exe`

### Q: 如何手动添加到 PATH？

**A:** 
1. 右键"此电脑" → "属性" → "高级系统设置"
2. 点击"环境变量"
3. 在"系统变量"中找到 `Path`，点击"编辑"
4. 添加 Git 的安装路径（如 `C:\Program Files\Git\cmd`）
5. 确定并重启终端

## 下一步

安装完 Git 后，请运行：
```powershell
.\init-git.ps1
```

这将自动初始化 Git 仓库并创建初始提交。
