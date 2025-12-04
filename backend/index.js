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
                inspectedByPeerCheck: zeroAddr, inspectedByPeerCheckName: "", inspectedByPeerCheckId: "",
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
                inspectedByPeerCheck: zeroAddr,
                inspectedByPeerCheckName: "",
                inspectedByPeerCheckId: "",
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

// 辅助函数：处理 BigInt 序列化问题
function convertBigIntToString(obj) {
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    // 尝试将 Ethers Result 转换为普通对象 (如果有命名键)
    if (obj && typeof obj.toObject === 'function') {
        try {
            return convertBigIntToString(obj.toObject());
        } catch (e) {
            // 如果转换失败 (例如纯数组没有命名键)，则忽略错误，继续按数组处理
        }
    }
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object' && obj !== null) {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, convertBigIntToString(v)])
        );
    }
    return obj;
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
