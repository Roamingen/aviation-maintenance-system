# ✈️ 基于区块链的民航客机检修记录存证系统

这是一个基于区块链技术的民航飞机检修记录存证系统，旨在解决传统纸质或中心化数据库记录易篡改、难追溯的问题。系统采用 **Ethereum (Hardhat)** 作为底层区块链网络，结合 **Node.js** 后端和 **Vue 3** 前端，实现数据的不可篡改存储和透明查询。

本项目采用 **后端托管钱包 (Managed Wallet)** 模式，用户无需安装 MetaMask 插件即可使用，降低了使用门槛。

## ✨ 功能特性

*   **去中心化存储**：所有检修记录的核心数据（如飞机号、工作描述、签名、航材消耗等）均存储在区块链上。
*   **数据不可篡改**：利用区块链特性，一旦记录上链，任何人无法修改或删除。
*   **自动哈希索引**：系统自动为每条记录生成唯一的 **Hash ID** (作为工作单号)，确保记录的唯一性和可验证性。
*   **多维度查询**：
    *   **按工作单号 (Hash)**：精确查询单条记录详情。
    *   **按飞机注册号**：查询该飞机的历史检修时间轴。
    *   **按机械师**：查询特定机械师的工作记录。
*   **动态数据录入**：支持动态添加消耗件、工具、测试数据和更换件信息。
*   **可视化界面**：提供直观的 Web 界面，包含侧边栏导航、时间轴展示和详细信息查看。

## 🛠️ 技术栈

*   **区块链**: Solidity, Hardhat, Ethers.js v6
*   **后端**: Node.js, Express.js
*   **前端**: Vue 3, Vite, Element Plus
*   **脚本**: PowerShell (用于一键启动/停止)
*   **开发环境**: Windows (推荐), Node.js v18+

## 📂 项目结构

```
aviation-maintenance-system/
├── contracts/          # 智能合约源码 (Solidity)
├── scripts/            # 合约部署脚本
├── backend/            # Node.js 后端服务 (API & 钱包管理)
│   ├── config.js       # 后端配置文件 (合约地址在此配置)
│   ├── index.js        # 后端入口文件
│   └── seed.js         # 种子数据脚本
├── frontend/           # Vue 3 前端项目
│   ├── src/            # 前端源码
│   └── vite.config.js  # Vite 配置
├── hardhat.config.js   # Hardhat 配置文件
├── start_dev.ps1       # [新增] 一键启动脚本 (PowerShell)
├── stop_dev.ps1        # [新增] 一键停止脚本 (PowerShell)
├── start_dev.bat       # [新增] 一键启动脚本 (CMD/双击运行)
├── stop_dev.bat        # [新增] 一键停止脚本 (CMD/双击运行)
└── README.md           # 项目说明文档
```

## 🚀 部署与运行指南 (自动化)

本项目提供了 Windows PowerShell 自动化脚本，可一键完成环境启动、合约部署和配置更新。

### 1. 环境准备

确保已安装 [Node.js](https://nodejs.org/) (建议 v20.x) 和 Git。
确保你的终端是 PowerShell。

### 2. 首次安装依赖

首次运行前，请执行以下命令安装所有模块依赖：

```bash
# 根目录依赖
npm install

# 后端依赖
cd backend
npm install
cd ..

# 前端依赖
cd frontend
npm install
cd ..
```

### 3. 一键启动 (推荐)

你可以选择以下任意一种方式启动：

**方式 A: 使用 PowerShell (推荐开发人员)**
```powershell
.\start_dev.ps1
```

**方式 B: 使用 CMD / 双击运行 (推荐普通用户)**
直接双击根目录下的 `start_dev.bat` 文件。

**脚本会自动执行以下操作：**
1.  启动 Hardhat 本地节点。
2.  部署智能合约到本地网络。
3.  **自动更新** `backend/config.js` 中的合约地址。
4.  启动后端服务 (API)。
5.  启动前端服务 (Vite)。

启动完成后，脚本会保持运行。你可以直接访问：
*   **前端页面**: [http://localhost:5173](http://localhost:5173)
*   **后端 API**: [http://localhost:3000](http://localhost:3000)

### 4. 一键停止

要停止所有服务（包括后台运行的 Node 进程），请运行：

*   **PowerShell**: `.\stop_dev.ps1`
*   **CMD / 双击**: 双击 `stop_dev.bat` 
> **注意：这会顺便关掉所有cmd窗口！！！**

### 5. 注入测试数据 (可选)

项目包含一个种子脚本，用于向区块链预填充测试数据（如轮胎更换、故障排查记录等）。

**使用方法：**

1.  确保系统已启动（执行完步骤 3）。
2.  打开一个新的终端窗口。
3.  运行以下命令：

```bash
cd backend
node seed.js
```

脚本运行完成后，你可以在前端页面通过搜索飞机号（如 `B-1234`, `B-5678`）来查看这些记录。

---

## 🛠️ 手动启动模式 (备用)

如果脚本无法运行，你可以手动分步启动：

1.  **启动节点**: `npx hardhat node`
2.  **部署合约**: `npx hardhat run scripts/deploy.js --network localhost`
3.  **更新配置**: 复制部署地址，更新 `backend/config.js`。
4.  **启动后端**: `cd backend && node index.js`
5.  **启动前端**: `cd frontend && npm run dev`

---

## ❓ 常见问题 (FAQ)

**Q: 脚本提示 "禁止运行脚本" (cannot be loaded because running scripts is disabled)？**
A: 这是 Windows 的默认安全策略。
**解决方法 1 (推荐)**：直接使用 `start_dev.bat`，它不受此限制。
**解决方法 2**：在 PowerShell 中运行以下命令（无需管理员权限）：
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
输入 `Y` 确认即可。

**Q: 如何重置整个系统？**
A: 运行 `.\stop_dev.ps1` 停止服务，然后再次运行 `.\start_dev.ps1`。每次重启都会重置本地区块链状态。

**Q: 提交记录时报错？**
A: 请检查后端日志。系统现在使用**托管钱包**模式，后端会自动处理签名，无需前端连接 MetaMask。

## 📄 License

MIT
