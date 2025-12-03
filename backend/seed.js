const { contract } = require('./config');
const { ethers } = require("ethers");

async function main() {
    console.log("🚀 开始预填充测试数据...");

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
                performedBy: "张三 (001)",
                performTime: Math.floor(Date.now() / 1000),
                inspectedBy: "李四 (002)",
                riiBy: "王五 (RII)",
                releaseBy: "赵六 (Release)"
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
                performedBy: "Mike (A003)",
                performTime: Math.floor(Date.now() / 1000) - 3600,
                inspectedBy: "Sarah (A004)",
                riiBy: "",
                releaseBy: "Tom (Release)"
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
                performedBy: "陈工 (E001)",
                performTime: Math.floor(Date.now() / 1000) - 7200,
                inspectedBy: "刘工 (E002)",
                riiBy: "",
                releaseBy: "张经理"
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
                performedBy: "王强 (H005)",
                performTime: Math.floor(Date.now() / 1000) - 10000,
                inspectedBy: "赵雷",
                riiBy: "孙监察",
                releaseBy: "周放行"
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
                performedBy: "Geek (S001)",
                performTime: Math.floor(Date.now() / 1000) - 500,
                inspectedBy: "N/A",
                riiBy: "",
                releaseBy: "Master"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        }
    ];

    // 手动管理 Nonce，防止 "nonce has already been used" 错误
    let currentNonce = await contract.runner.getNonce();
    console.log(`🔧 当前起始 Nonce: ${currentNonce}`);

    for (const record of sampleRecords) {
        try {
            // 生成 Hash ID
            const uniqueString = `${record.aircraftRegNo}-${Date.now()}-${Math.random()}`;
            record.recordId = ethers.id(uniqueString);
            // 确保 jobCardNo 也使用 Hash (与后端逻辑一致)
            record.jobCardNo = record.recordId;

            console.log(`📝 正在添加记录: ${record.workType} - ${record.aircraftRegNo} (Nonce: ${currentNonce})...`);
            
            // 显式传递 nonce
            const tx = await contract.addRecord(record, { nonce: currentNonce });
            
            // 交易发送成功后，立即增加 nonce，供下一次循环使用
            currentNonce++;

            await tx.wait();
            console.log(`✅ 成功添加: ${record.recordId.slice(0, 10)}...`);
        } catch (error) {
            if (error.reason && error.reason.includes("already exists")) {
                console.log(`⚠️ 记录已存在`);
                // 如果是因为记录存在而 revert，说明交易其实执行了（或者在模拟执行时失败），
                // 如果是 revert，nonce 通常会被消耗（如果上链了）。
                // 但如果是 call static 检查失败，nonce 没消耗。
                // Ethers v6 默认会先 estimateGas，如果 revert，则不发送交易，nonce 不消耗。
                // 所以这里不增加 nonce 是对的。
            } else {
                console.error(`❌ 添加失败:`, error.reason || error.message);
                
                // 如果出现 nonce 错误，尝试重新获取一次最新的 nonce
                if (error.message && error.message.includes("nonce")) {
                    console.log("🔄 检测到 Nonce 错误，重新获取 Nonce...");
                    currentNonce = await contract.runner.getNonce();
                }
            }
        }
    }
    
    console.log("🎉 数据预填充完成！");
}

main();
