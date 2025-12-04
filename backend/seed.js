const { contract, wallet } = require('./config');
const { ethers } = require("ethers");

// Hardhat Account #1 (Inspector/Releaser)
// Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
const INSPECTOR_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

async function main() {
    console.log("🚀 开始预填充测试数据...");

    // 1. 设置第二个钱包 (Inspector)
    const provider = contract.runner.provider;
    const inspectorWallet = new ethers.Wallet(INSPECTOR_PRIVATE_KEY, provider);
    const inspectorContract = contract.connect(inspectorWallet);

    // 2. 授权第二个钱包 (Owner -> Inspector)
    // 检查是否已授权
    const isAuthorized = await contract.authorizedNodes(inspectorWallet.address);
    if (!isAuthorized) {
        console.log(`🔑 正在授权 Inspector 钱包 (${inspectorWallet.address})...`);
        const authTx = await contract.setNodeAuthorization(inspectorWallet.address, true);
        await authTx.wait();
        console.log(`   > 授权成功`);
    } else {
        console.log(`🔑 Inspector 钱包已授权`);
    }

    const sampleRecords = [
        // 1. 轮胎更换 (B-1234)
        {
            aircraftRegNo: "B-1234",
            aircraftType: "B737-800",
            jobCardNo: "JC-2025-001", // 这里的工卡号会被 Hash 覆盖，仅作注释用
            revision: 1,
            ataCode: "32-40",
            workType: "更换",
            location: "北京维修基地",
            workDescription: "左主起落架 #1 轮胎磨损超标，依据 AMM 手册进行更换。检查轮毂无损伤，气压正常。",
            referenceDocument: "AMM 32-45-00",
            usedParts: [
                { partNumber: "GY-737-TIRE", serialNumber: "SN-20250101" }
            ],
            usedTools: ["TL-JACK-001", "TL-TORQUE-050"],
            testMeasureData: [
                { testItemName: "轮胎气压", measuredValues: "205 PSI", isPass: true },
                { testItemName: "轮毂涡流探伤", measuredValues: "无裂纹", isPass: true }
            ],
            faultInfo: {
                fimCode: "",
                faultDescription: ""
            },
            signatures: {
                performedByName: "张三",
                performedById: "001",
                inspectedByName: "李四",
                inspectedById: "002",
                riiByName: "王五",
                riiById: "RII-001",
                releaseByName: "赵六",
                releaseById: "REL-001"
            },
            replaceInfo: [
                {
                    removedPartNo: "GY-737-TIRE",
                    removedSerialNo: "SN-20231212",
                    removedStatus: "磨损超标",
                    installedPartNo: "GY-737-TIRE",
                    installedSerialNo: "SN-20250101",
                    installedSource: "航材库房",
                    replacementReason: "例行更换"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 2. 空调故障排查 (B-5678)
        {
            aircraftRegNo: "B-5678",
            aircraftType: "A320neo",
            jobCardNo: "JC-2025-002",
            revision: 1,
            ataCode: "21-50",
            workType: "排故",
            location: "广州白云机场",
            workDescription: "机组报告驾驶舱温度无法调节。测试发现温度控制活门卡阻。更换温度控制活门，测试正常。",
            referenceDocument: "TSM 21-50-00 / AMM 21-61-00",
            usedParts: [
                { partNumber: "VALVE-TC-320", serialNumber: "VN-889900" },
                { partNumber: "SEAL-RING-05", serialNumber: "N/A" }
            ],
            usedTools: ["TL-MULTI-METER", "TL-WRENCH-SET"],
            testMeasureData: [
                { testItemName: "活门电阻测试", measuredValues: "150 Ohm", isPass: true },
                { testItemName: "功能测试", measuredValues: "温度调节响应正常", isPass: true }
            ],
            faultInfo: {
                fimCode: "21-50-00-810-801",
                faultDescription: "驾驶舱温度无法调节，ECAM 警告 AIR COND"
            },
            signatures: {
                performedByName: "Mike",
                performedById: "A003",
                inspectedByName: "Sarah",
                inspectedById: "A004",
                riiByName: "",
                riiById: "",
                releaseByName: "Tom",
                releaseById: "REL-002"
            },
            replaceInfo: [
                {
                    removedPartNo: "VALVE-TC-320",
                    removedSerialNo: "VN-112233",
                    removedStatus: "内部卡阻",
                    installedPartNo: "VALVE-TC-320",
                    installedSerialNo: "VN-889900",
                    installedSource: "现场拆件",
                    replacementReason: "故障更换"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 3. 发动机例行检查 (B-9999) - 无更换件
        {
            aircraftRegNo: "B-9999",
            aircraftType: "B787-9",
            jobCardNo: "JC-2025-003",
            revision: 2,
            ataCode: "72-00",
            workType: "检查",
            location: "上海浦东机坪",
            workDescription: "执行发动机孔探检查。高压压气机叶片发现轻微外物打伤，在手册允许范围内。已记录并监控。",
            referenceDocument: "AMM 72-00-00",
            usedParts: [],
            usedTools: ["TL-BORESCOPE-VID"],
            testMeasureData: [
                { testItemName: "HPC 第5级叶片损伤", measuredValues: "深度 0.05mm (Limit 0.1mm)", isPass: true },
                { testItemName: "燃烧室检查", measuredValues: "正常", isPass: true }
            ],
            faultInfo: {
                fimCode: "",
                faultDescription: ""
            },
            signatures: {
                performedByName: "陈工",
                performedById: "E001",
                inspectedByName: "刘工",
                inspectedById: "E002",
                riiByName: "",
                riiById: "",
                releaseByName: "张经理",
                releaseById: "MGR-001"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 4. 液压系统泄漏处理 (B-1234) - 多个更换件
        {
            aircraftRegNo: "B-1234",
            aircraftType: "B737-800",
            jobCardNo: "JC-2025-004",
            revision: 1,
            ataCode: "29-10",
            workType: "排故",
            location: "北京维修基地",
            workDescription: "A系统液压泵低压灯亮。检查发现回油滤堵塞，且泵壳体有渗漏。更换液压泵及滤芯。",
            referenceDocument: "AMM 29-11-00",
            usedParts: [
                { partNumber: "HYD-PUMP-737", serialNumber: "HP-9988" },
                { partNumber: "FILTER-ELEM", serialNumber: "Batch-2024" }
            ],
            usedTools: ["TL-CROWFOOT", "TL-DRAIN-KIT"],
            testMeasureData: [
                { testItemName: "系统压力测试", measuredValues: "3000 PSI", isPass: true },
                { testItemName: "泄漏检查", measuredValues: "无泄漏", isPass: true }
            ],
            faultInfo: {
                fimCode: "29-10-00-810-805",
                faultDescription: "HYD SYS A LOW PRESS"
            },
            signatures: {
                performedByName: "王强",
                performedById: "H005",
                inspectedByName: "赵雷",
                inspectedById: "INS-003",
                riiByName: "孙监察",
                riiById: "RII-002",
                releaseByName: "周放行",
                releaseById: "REL-003"
            },
            replaceInfo: [
                {
                    removedPartNo: "HYD-PUMP-737",
                    removedSerialNo: "HP-1122",
                    removedStatus: "壳体裂纹",
                    installedPartNo: "HYD-PUMP-737",
                    installedSerialNo: "HP-9988",
                    installedSource: "库房",
                    replacementReason: "故障"
                },
                {
                    removedPartNo: "FILTER-ELEM",
                    removedSerialNo: "Old-Batch",
                    removedStatus: "堵塞",
                    installedPartNo: "FILTER-ELEM",
                    installedSerialNo: "Batch-2024",
                    installedSource: "库房",
                    replacementReason: "预防性更换"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 5. 电子设备改装 (B-8888)
        {
            aircraftRegNo: "B-8888",
            aircraftType: "A350-900",
            jobCardNo: "JC-2025-005",
            revision: 1,
            ataCode: "23-50",
            workType: "改装",
            location: "成都双流",
            workDescription: "执行 SB-23-1234，升级音频控制面板软件版本。升级后测试通讯功能正常。",
            referenceDocument: "SB A350-23-1234",
            usedParts: [],
            usedTools: ["TL-DATA-LOADER"],
            testMeasureData: [
                { testItemName: "软件版本校验", measuredValues: "V2.5.0", isPass: true },
                { testItemName: "VHF 通讯测试", measuredValues: "清晰", isPass: true }
            ],
            faultInfo: {
                fimCode: "",
                faultDescription: ""
            },
            signatures: {
                performedByName: "Geek",
                performedById: "S001",
                inspectedByName: "N/A",
                inspectedById: "",
                riiByName: "",
                riiById: "",
                releaseByName: "Master",
                releaseById: "REL-004"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        }
    ];

    // 手动管理 Nonce，防止 "nonce has already been used" 错误
    let currentNonce = await contract.runner.getNonce();
    let inspectorNonce = await inspectorWallet.getNonce();
    console.log(`🔧 当前起始 Nonce: Owner=${currentNonce}, Inspector=${inspectorNonce}`);

    for (const record of sampleRecords) {
        try {
            // 生成 Hash ID
            const uniqueString = `${record.aircraftRegNo}-${Date.now()}-${Math.random()}`;
            record.recordId = ethers.id(uniqueString);
            // 确保 jobCardNo 也使用 Hash (与后端逻辑一致)
            record.jobCardNo = record.recordId;

            console.log(`📝 正在添加记录: ${record.workType} - ${record.aircraftRegNo}...`);
            
            // 1. 构造符合合约新结构的 Signatures 对象
            // 暂存后续签名需要的名字
            const inspectorName = record.signatures.inspectedByName;
            const inspectorId = record.signatures.inspectedById;
            const releaserName = record.signatures.releaseByName;
            const releaserId = record.signatures.releaseById;
            
            const zeroAddr = "0x0000000000000000000000000000000000000000";
            record.signatures = {
                performedBy: zeroAddr,
                performedByName: record.signatures.performedByName,
                performedById: record.signatures.performedById, // 确保这里正确传递了工号
                performTime: 0,
                inspectedBy: zeroAddr,
                inspectedByName: "", // 初始为空，后续签名时填入
                inspectedById: "",
                riiBy: zeroAddr,
                riiByName: "",
                riiById: "",
                releaseBy: zeroAddr,
                releaseByName: "", // 初始为空，后续签名时填入
                releaseById: "",
                releaseTime: 0
            };
            record.status = 0; // Pending

            // 2. 提交记录 (Add Record) - 使用 Owner 钱包
            const tx = await contract.addRecord(record, { nonce: currentNonce });
            currentNonce++;
            await tx.wait();
            console.log(`   > 记录已创建 (Pending)`);

            // 3. 互检签名 (Sign Inspection) - 使用 Inspector 钱包
            if (inspectorName && inspectorName !== "N/A") {
                console.log(`   > 正在进行互检签名: ${inspectorName} (by Inspector Wallet)...`);
                const tx2 = await inspectorContract.signInspection(record.recordId, inspectorName, inspectorId, { nonce: inspectorNonce });
                inspectorNonce++;
                await tx2.wait();
            }

            // 4. 放行签名 (Sign Release) - 使用 Owner 钱包 (或者 Inspector 钱包，这里演示用 Owner)
            if (releaserName) {
                console.log(`   > 正在进行放行签名: ${releaserName} (by Owner Wallet)...`);
                const tx3 = await contract.signRelease(record.recordId, releaserName, releaserId, { nonce: currentNonce });
                currentNonce++;
                await tx3.wait();
                console.log(`   > 记录已放行 (Released)`);
            }

            console.log(`✅ 流程结束: ${record.recordId.slice(0, 10)}...`);
        } catch (error) {
            if (error.reason && error.reason.includes("already exists")) {
                console.log(`⚠️ 记录已存在`);
            } else {
                console.error(`❌ 添加失败:`, error.reason || error.message);
                
                // 如果出现 nonce 错误，尝试重新获取一次最新的 nonce
                if (error.message && error.message.includes("nonce")) {
                    console.log("🔄 检测到 Nonce 错误，重新获取 Nonce...");
                    currentNonce = await contract.runner.getNonce();
                    inspectorNonce = await inspectorWallet.getNonce();
                }
            }
        }
    }
    
    console.log("🎉 数据预填充完成！");
}

main();
