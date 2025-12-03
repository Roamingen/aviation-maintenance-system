# ✈️ 基于区块链的民航客机检修记录存证系统

这是一个基于区块链技术的民航飞机检修记录存证系统，旨在解决传统纸质或中心化数据库记录易篡改、难追溯的问题。系统采用 **Ethereum (Hardhat)** 作为底层区块链网络，结合 **Node.js** 后端和 **Vue 3** 前端，实现数据的不可篡改存储和透明查询。

本项目采用 **后端托管钱包 (Managed Wallet)** 模式，用户无需安装 MetaMask 插件即可使用，降低了使用门槛。

## ✨ 功能特性

*   **去中心化存储**：所有检修记录的核心数据（如飞机号、工卡号、工作描述、签名等）均存储在区块链上。
*   **数据不可篡改**：利用区块链特性，一旦记录上链，任何人无法修改或删除。
*   **多维度查询**：
    *   支持通过 **记录编号 (Hash)** 精确查询。
    *   支持通过 **飞机注册号** 查询该飞机的历史检修记录。
    *   支持通过 **工卡号** 查询特定任务的执行记录。
*   **可视化界面**：提供直观的 Web 界面，包含侧边栏导航、时间轴展示和详细信息查看。
*   **角色分离**：
    *   **访客/监管**：可查询和验证记录。
    *   **机械师**：可录入新的检修记录（需后端授权）。

## 🛠️ 技术栈

*   **区块链**: Solidity, Hardhat, Ethers.js v6
*   **后端**: Node.js, Express.js
*   **前端**: Vue 3, Vite, Element Plus
*   **开发环境**: Windows/Linux/Mac, Node.js v18+ (推荐 v20)

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
└── README.md           # 项目说明文档
```

## 🚀 部署与运行指南

请按照以下步骤在本地环境启动项目。

### 1. 环境准备

确保已安装 [Node.js](https://nodejs.org/) (建议 v20.x) 和 Git。

克隆项目到本地：
```bash
git clone <your-repo-url>
cd aviation-maintenance-system
```

### 2. 安装依赖

我们需要分别为根目录（Hardhat）、后端和前端安装依赖。

**根目录 (Hardhat):**
```bash
npm install
```

**后端 (Backend):**
```bash
cd backend
npm install
cd ..
```

**前端 (Frontend):**
```bash
cd frontend
npm install
cd ..
```

### 3. 启动本地区块链网络

打开第 1 个终端窗口，运行 Hardhat 本地节点：

```bash
npx hardhat node
```
> **注意**：请保持此终端窗口一直开启。启动后你会看到一系列生成的测试账户（Account #0, #1...）和私钥。

### 4. 部署智能合约

打开第 2 个终端窗口，部署合约到本地网络：

```bash
npx hardhat run scripts/deploy.js --network localhost
```

**关键步骤**：
部署成功后，终端会输出类似如下信息：
```
AviationMaintenance deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```
请**复制**这个合约地址。

### 5. 配置后端

打开文件 `backend/config.js`，将 `CONTRACT_ADDRESS` 的值修改为你刚刚复制的地址：

```javascript
// backend/config.js
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // <--- 替换这里
// ...
```

### 6. 启动后端服务

在第 2 个终端窗口中（或者新开一个），进入 `backend` 目录并启动服务：

```bash
cd backend
node index.js
```
*后端服务默认运行在 http://localhost:3000*

*(可选) 注入测试数据：*
如果你想先有一些初始数据，可以运行种子脚本：
```bash
node seed.js
```

### 7. 启动前端界面

打开第 3 个终端窗口，进入 `frontend` 目录并启动：

```bash
cd frontend
npm run dev
```
*前端服务默认运行在 http://localhost:5173*

### 8. 开始使用

打开浏览器访问 `http://localhost:5173`。

*   **查询信息**：输入飞机号（如 `B-1234`）或工卡号进行查询。
*   **录入信息**：切换到“录入信息”页面，填写表单并提交上链。

## ❓ 常见问题 (FAQ)

**Q: 提交记录时报错 `Error: missing value for component recorder`？**
A: 这是由于 Ethers.js v6 对结构体参数的严格检查。请确保后端代码已更新，手动注入了 `recorder` 和 `timestamp` 的占位符值。

**Q: 前端查询不到刚才提交的记录？**
A: 请检查后端终端是否有报错。如果使用了 `seed.js`，请确保种子脚本里的合约地址也更新了。另外，确保 Hardhat 节点（第 1 个终端）没有被关闭。

**Q: 如何重置整个系统？**
A: 
1. 关闭所有终端。
2. 重新运行 `npx hardhat node`（这会重置区块链状态）。
3. 重新运行 `npx hardhat run scripts/deploy.js ...`（获取新地址）。
4. 更新 `backend/config.js` 中的新地址。
5. 重启后端和前端。

## 📄 License

MIT
