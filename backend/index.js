const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers'); // 引入 ethers
const { contract, CONTRACT_ADDRESS, ABI } = require('./config');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ================= API 路由 =================

// 0. 获取合约配置 (供前端使用)
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        address: CONTRACT_ADDRESS,
        abi: ABI
    });
});

// 1. 健康检查
app.get('/', (req, res) => {
    res.send('Aviation Maintenance Blockchain API is running');
});

// 2. 查询：根据 Record ID 获取记录
app.get('/api/record/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const record = await contract.getRecordById(recordId);
        
        const formattedRecord = convertBigIntToString(record);
        res.json({ success: true, data: formattedRecord });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// 3. 查询：根据注册号获取所有 Record ID
app.get('/api/aircraft/:regNo', async (req, res) => {
    try {
        const { regNo } = req.params;
        const recordIds = await contract.getRecordIdsByAircraft(regNo);
        
        // 获取每个 ID 对应的详情 (为了前端列表展示方便，这里直接并发查询详情)
        // 如果数据量大，应该分页或只返回 ID
        const records = await Promise.all(recordIds.map(async (id) => {
            const r = await contract.getRecordById(id);
            return convertBigIntToString(r);
        }));

        res.json({ success: true, data: records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3.5 查询：根据工卡号获取所有 Record ID
app.get('/api/jobcard/:jobCardNo', async (req, res) => {
    try {
        const { jobCardNo } = req.params;
        const recordIds = await contract.getRecordIdsByJobCard(jobCardNo);
        
        const records = await Promise.all(recordIds.map(async (id) => {
            const r = await contract.getRecordById(id);
            return convertBigIntToString(r);
        }));

        res.json({ success: true, data: records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3.6 查询：根据机械师工号获取所有 Record ID
app.get('/api/mechanic/:mechanicId', async (req, res) => {
    try {
        const { mechanicId } = req.params;
        const recordIds = await contract.getRecordIdsByMechanic(mechanicId);
        
        const records = await Promise.all(recordIds.map(async (id) => {
            const r = await contract.getRecordById(id);
            return convertBigIntToString(r);
        }));

        res.json({ success: true, data: records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3.7 查询：获取所有记录 (分页)
app.get('/api/records', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        // 1. 获取总数
        const totalBigInt = await contract.getRecordCount();
        const total = Number(totalBigInt);

        // 2. 获取当前页的 ID 列表 (合约已处理倒序)
        const pageIds = await contract.getRecordIdsByPage(page, pageSize);
        
        // 3. 获取详情
        const records = await Promise.all(pageIds.map(async (id) => {
            const r = await contract.getRecordById(id);
            return convertBigIntToString(r);
        }));

        res.json({ 
            success: true, 
            data: records,
            total: total,
            page: page,
            pageSize: pageSize
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. 写入：添加检修记录
app.post('/api/record', async (req, res) => {
    try {
        const recordData = req.body;
        
        // 生成 Record ID (Hash)
        // 使用 ethers.id (keccak256) 生成
        // 这里的 jobCardNo 已经不再是用户输入的工卡号，而是我们即将生成的唯一标识
        // 为了生成唯一标识，我们使用 注册号 + 时间戳 + 随机数
        const uniqueString = `${recordData.aircraftRegNo}-${Date.now()}-${Math.random()}`;
        const hashId = ethers.id(uniqueString);
        
        // 将生成的 Hash 注入数据
        // 1. recordId 使用 Hash
        recordData.recordId = hashId;
        // 2. jobCardNo 也使用 Hash (作为唯一工作单号)
        recordData.jobCardNo = hashId;

        // 补充合约结构体所需的占位符字段 (ethers.js 编码需要，虽然合约会覆盖)
        recordData.recorder = "0x0000000000000000000000000000000000000000";
        recordData.timestamp = 0;
        recordData.status = 0; // RecordStatus.Pending
        
        // 确保 isRII 存在
        if (typeof recordData.isRII === 'undefined') recordData.isRII = false;

        // 确保可选结构体存在，防止 ethers.js 报错
        if (!recordData.usedParts) recordData.usedParts = [];
        if (!recordData.usedTools) recordData.usedTools = [];
        if (!recordData.testMeasureData) recordData.testMeasureData = [];
        if (!recordData.replaceInfo) recordData.replaceInfo = [];
        if (!recordData.faultInfo) recordData.faultInfo = { fimCode: "", faultDescription: "" };
        
        // 确保 signatures 存在并符合新结构
        const zeroAddr = "0x0000000000000000000000000000000000000000";
        if (!recordData.signatures) {
            recordData.signatures = { 
                performedBy: zeroAddr, performedByName: "", performedById: "", performTime: 0,
                peerChecks: [], // 新增: 互检人员列表
                riiBy: zeroAddr, riiByName: "", riiById: "",
                releaseBy: zeroAddr, releaseByName: "", releaseById: "", releaseTime: 0
            };
        } else {
            // 适配前端可能传来的旧数据或新数据
            const s = recordData.signatures;
            recordData.signatures = {
                performedBy: zeroAddr, // 合约会覆盖为 msg.sender
                performedByName: s.performedByName || s.performedBy || "", // 兼容旧字段
                performedById: s.performedById || "", // 新增工号
                performTime: s.performTime || 0, // 使用前端传来的时间
                peerChecks: [], // 初始化为空数组
                riiBy: zeroAddr,
                riiByName: "",
                riiById: "",
                releaseBy: zeroAddr,
                releaseByName: "",
                releaseById: "",
                releaseTime: 0
            };
        }

        // 调用合约写入函数
        const tx = await contract.addRecord(recordData, { gasPrice: 0 });
        
        const receipt = await tx.wait();
        
        res.json({ 
            success: true, 
            txHash: receipt.hash,
            recordId: hashId,
            jobCardNo: hashId // 返回生成的工卡号(Hash)
        });
    } catch (error) {
        console.error("Transaction failed:", error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// ================= 管理员功能 (测试用) =================

// 6. 授权钱包 (Admin)
app.post('/api/admin/authorize', async (req, res) => {
    try {
        let { address } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }

        address = address.trim();
        try {
            address = ethers.getAddress(address);
        } catch (e) {
            return res.status(400).json({ success: false, error: "Invalid address format" });
        }
        
        console.log(`Authorizing wallet: ${address}`);
        const tx = await contract.setNodeAuthorization(address, true, { gasPrice: 0 });
        await tx.wait();
        
        res.json({ success: true, message: `Wallet ${address} authorized successfully`, txHash: tx.hash });
    } catch (error) {
        console.error("Authorization error:", error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// 7. 发送 ETH (Admin - Faucet)
app.post('/api/admin/fund', async (req, res) => {
    try {
        let { address, amount } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }

        // 清理地址格式，防止 ethers 尝试 ENS 解析
        address = address.trim();
        try {
            address = ethers.getAddress(address);
        } catch (e) {
            return res.status(400).json({ success: false, error: "Invalid address format" });
        }
        
        const ethAmount = amount || "1.0";
        console.log(`Funding wallet: ${address} with ${ethAmount} ETH`);
        
        // 使用后端钱包 (Account #0) 发送 ETH
        // config.js 导出了 wallet 实例
        const { wallet } = require('./config');
        
        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther(ethAmount),
            gasPrice: 0
        });
        await tx.wait();
        
        res.json({ success: true, message: `Sent ${ethAmount} ETH to ${address}`, txHash: tx.hash });
    } catch (error) {
        console.error("Funding error:", error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// 7.5 获取水龙头余额 (Admin)
app.get('/api/admin/faucet-balance', async (req, res) => {
    try {
        const { wallet } = require('./config');
        const provider = wallet.provider;
        const balance = await provider.getBalance(wallet.address);
        res.json({ success: true, balance: ethers.formatEther(balance), address: wallet.address });
    } catch (error) {
        console.error("Error fetching faucet balance:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. 获取所有授权节点 (Admin)
app.get('/api/admin/authorized-nodes', async (req, res) => {
    try {
        const nodes = await contract.getAuthorizedNodes();
        // nodes is likely a Proxy or Result, convert it
        const rawList = Array.from(nodes);
        
        // 获取余额
        const provider = contract.runner.provider;
        const nodeList = await Promise.all(rawList.map(async (addr) => {
            try {
                const bal = await provider.getBalance(addr);
                return {
                    address: addr,
                    balance: ethers.formatEther(bal)
                };
            } catch (e) {
                return { address: addr, balance: "Error" };
            }
        }));

        res.json({ success: true, data: nodeList });
    } catch (error) {
        console.error("Error fetching authorized nodes:", error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// 8.5 扣除资金 (Admin - Hardhat Only)
app.post('/api/admin/deduct-fund', async (req, res) => {
    try {
        const { address, amount } = req.body;
        if (!address || !amount) {
            return res.status(400).json({ success: false, error: "Address and amount are required" });
        }

        const provider = contract.runner.provider;
        const currentBal = await provider.getBalance(address);
        const deductBig = ethers.parseEther(amount.toString());

        if (currentBal < deductBig) {
             return res.status(400).json({ success: false, error: "Insufficient funds" });
        }

        const newBal = currentBal - deductBig;
        // Convert to hex string for JSON-RPC (remove 0x prefix if present then add it back, or just toString(16))
        const newBalHex = "0x" + newBal.toString(16);

        // hardhat_setBalance expects address and hex balance
        await provider.send("hardhat_setBalance", [address, newBalHex]);

        // 将扣除的资金“归还”给水龙头 (Account #0)
        const faucetWallet = contract.runner;
        const faucetAddress = faucetWallet.address;
        const currentFaucetBal = await provider.getBalance(faucetAddress);
        const newFaucetBal = currentFaucetBal + deductBig;
        const newFaucetBalHex = "0x" + newFaucetBal.toString(16);
        
        await provider.send("hardhat_setBalance", [faucetAddress, newFaucetBalHex]);

        res.json({ success: true, newBalance: ethers.formatEther(newBal) });
    } catch (error) {
        console.error("Deduct fund error:", error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// 9. 取消授权 (Admin)
app.post('/api/admin/revoke', async (req, res) => {
    try {
        let { address } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }

        address = address.trim();
        try {
            address = ethers.getAddress(address);
        } catch (e) {
            return res.status(400).json({ success: false, error: "Invalid address format" });
        }
        
        console.log(`Revoking authorization for wallet: ${address}`);
        const tx = await contract.setNodeAuthorization(address, false, { gasPrice: 0 });
        await tx.wait();
        
        res.json({ success: true, message: `Wallet ${address} authorization revoked`, txHash: tx.hash });
    } catch (error) {
        console.error("Revocation error:", error);
        res.status(500).json({ success: false, error: error.reason || error.message });
    }
});

// 辅助函数：处理 BigInt 序列化问题
function convertBigIntToString(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    
    // 尝试将 Ethers Result 转换为普通对象
    if (typeof obj.toObject === 'function') {
        try {
            // 尝试转换为对象
            const converted = obj.toObject();
            
            // 如果转换成功且不是数组，递归处理
            if (converted && typeof converted === 'object' && !Array.isArray(converted)) {
                // 检查是否有无效键 (如 '_')，这通常意味着它其实是一个数组或元组
                const keys = Object.keys(converted);
                const hasInvalidKeys = keys.some(k => k === '_');
                
                if (hasInvalidKeys) {
                    // 如果有无效键，说明它可能是个未命名的元组，应该当作数组处理
                    return Array.from(obj).map(convertBigIntToString);
                }
                return convertBigIntToString(converted);
            }
        } catch (e) {
            // 如果 toObject() 抛出 "value at index 0 unnamed" 错误
            // 说明这是一个未命名的数组/元组 (例如 string[] 或 struct[])
            // 这种情况下，我们应该直接把它当作数组来遍历
            if (e.code === 'UNSUPPORTED_OPERATION' || e.message.includes('unnamed')) {
                return Array.from(obj).map(convertBigIntToString);
            }
            console.warn("Failed to convert Result to object:", e);
        }
    }
    
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    
    if (typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            // 避免遍历原型链
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = convertBigIntToString(obj[key]);
            }
        }
        return newObj;
    }
    
    return obj;
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
