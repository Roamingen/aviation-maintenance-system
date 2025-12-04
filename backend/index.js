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

// 3. 查询：根据飞机号获取所有 Record ID
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
        // 为了生成唯一标识，我们使用 飞机号 + 时间戳 + 随机数
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
        const tx = await contract.addRecord(recordData);
        
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
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }
        
        console.log(`Authorizing wallet: ${address}`);
        const tx = await contract.setNodeAuthorization(address, true);
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
        const { address, amount } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, error: "Address is required" });
        }
        
        const ethAmount = amount || "1.0";
        console.log(`Funding wallet: ${address} with ${ethAmount} ETH`);
        
        // 使用后端钱包 (Account #0) 发送 ETH
        // config.js 导出了 wallet 实例
        const { wallet } = require('./config');
        
        const tx = await wallet.sendTransaction({
            to: address,
            value: ethers.parseEther(ethAmount)
        });
        await tx.wait();
        
        res.json({ success: true, message: `Sent ${ethAmount} ETH to ${address}`, txHash: tx.hash });
    } catch (error) {
        console.error("Funding error:", error);
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
            const converted = obj.toObject();
            // 检查转换后的对象是否有效
            // 如果是数组类型的 Result (如 PeerCheckSignature[])，toObject() 可能会返回 { _: ... } 或空对象
            // 这种情况下我们应该把它当作数组处理
            if (converted && typeof converted === 'object' && !Array.isArray(converted)) {
                const keys = Object.keys(converted);
                const hasInvalidKeys = keys.some(k => k === '_');
                // 如果包含无效键 '_'，或者转换为空对象但原对象是数组且有长度，说明转换不完全，应视为数组
                if (hasInvalidKeys || (keys.length === 0 && obj.length > 0)) {
                    return Array.from(obj).map(convertBigIntToString);
                }
                // 否则视为结构体
                return convertBigIntToString(converted);
            }
            // 如果 toObject 直接返回数组 (不太常见但可能)
            if (Array.isArray(converted)) {
                return convertBigIntToString(converted);
            }
        } catch (e) {
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
