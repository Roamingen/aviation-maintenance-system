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
            workType: "Life-limited Parts Replacement",
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
                performTime: Math.floor(Date.now() / 1000) - 86400 * 1, // 1天前
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
            workType: "Transit / Turnaround Check",
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
                performTime: Math.floor(Date.now() / 1000) - 86400 * 2, // 2天前
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
            workType: "A-Check",
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
                performTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3天前
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
            workType: "Daily Check",
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
                performTime: Math.floor(Date.now() / 1000) - 86400 * 4, // 4天前
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
            workType: "C-Check",
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
                performTime: Math.floor(Date.now() / 1000) - 86400 * 5, // 5天前
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
        },
        // 6. 每日例行检查 (B-2222) - 待互检 (Pending Peer Check)
        {
            aircraftRegNo: "B-2222",
            aircraftType: "A320-200",
            jobCardNo: "JC-2025-006",
            revision: 1,
            ataCode: "05-50",
            workType: "Daily Check",
            location: "深圳宝安机场",
            workDescription: "执行每日例行检查。检查机身蒙皮无损伤，起落架无渗漏。",
            referenceDocument: "AMM 05-51-00",
            usedParts: [],
            usedTools: ["TL-FLASHLIGHT"],
            testMeasureData: [
                { testItemName: "外观检查", measuredValues: "正常", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "新员工A",
                performedById: "N001",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 4,
                inspectedByName: "", // 缺失互检
                inspectedById: "",
                riiByName: "",
                riiById: "",
                releaseByName: "", // 缺失放行
                releaseById: ""
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 7. 周检 (B-3333) - 待放行 (Pending Release)
        {
            aircraftRegNo: "B-3333",
            aircraftType: "B737-700",
            jobCardNo: "JC-2025-007",
            revision: 1,
            ataCode: "05-20",
            workType: "Weekly Check",
            location: "西安咸阳机场",
            workDescription: "执行周检。清洁驾驶舱风挡，检查雨刷磨损情况。",
            referenceDocument: "AMM 05-21-00",
            usedParts: [],
            usedTools: ["TL-CLEAN-KIT"],
            testMeasureData: [
                { testItemName: "雨刷检查", measuredValues: "磨损在限制内", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "老员工B",
                performedById: "O002",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 5,
                inspectedByName: "检验员C",
                inspectedById: "INS-005",
                riiByName: "",
                riiById: "",
                releaseByName: "", // 缺失放行
                releaseById: ""
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 8. 发动机换发 (B-4444) - RII项目，待必检 (Pending RII)
        {
            aircraftRegNo: "B-4444",
            aircraftType: "B787-8",
            jobCardNo: "JC-2025-008",
            revision: 3,
            ataCode: "72-00",
            workType: "Engine Change",
            location: "厦门高崎机场",
            workDescription: "左发滑油消耗量超标，执行发动机更换。",
            referenceDocument: "AMM 72-00-00",
            usedParts: [
                { partNumber: "GEnx-1B", serialNumber: "ESN-999000" }
            ],
            usedTools: ["TL-ENG-HOIST", "TL-TORQUE-SET"],
            testMeasureData: [
                { testItemName: "试车参数", measuredValues: "N1/N2/EGT 正常", isPass: true }
            ],
            faultInfo: { fimCode: "72-00-00-810-801", faultDescription: "High Oil Consumption" },
            signatures: {
                performedByName: "动力组D",
                performedById: "P003",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 24,
                inspectedByName: "检验员E",
                inspectedById: "INS-006",
                riiByName: "", // 缺失 RII
                riiById: "",
                releaseByName: "",
                releaseById: ""
            },
            replaceInfo: [
                {
                    removedPartNo: "GEnx-1B",
                    removedSerialNo: "ESN-111222",
                    removedStatus: "故障",
                    installedPartNo: "GEnx-1B",
                    installedSerialNo: "ESN-999000",
                    installedSource: "厂家",
                    replacementReason: "性能衰退"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 9. 飞控测试 (B-5555) - RII项目，待放行 (Pending Release)
        {
            aircraftRegNo: "B-5555",
            aircraftType: "A350-1000",
            jobCardNo: "JC-2025-009",
            revision: 1,
            ataCode: "27-00",
            workType: "Functional Check",
            location: "北京大兴机场",
            workDescription: "更换升降舵伺服作动筒后，执行功能测试。",
            referenceDocument: "AMM 27-30-00",
            usedParts: [
                { partNumber: "ACTUATOR-ELEV", serialNumber: "SN-ACT-001" }
            ],
            usedTools: ["TL-HYD-CART"],
            testMeasureData: [
                { testItemName: "行程测试", measuredValues: "全行程无干涉", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "飞控组F",
                performedById: "FC001",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 12,
                inspectedByName: "检验员G",
                inspectedById: "INS-007",
                riiByName: "监察员H",
                riiById: "RII-003",
                releaseByName: "", // 缺失放行
                releaseById: ""
            },
            replaceInfo: [
                {
                    removedPartNo: "ACTUATOR-ELEV",
                    removedSerialNo: "SN-ACT-OLD",
                    removedStatus: "漏油",
                    installedPartNo: "ACTUATOR-ELEV",
                    installedSerialNo: "SN-ACT-001",
                    installedSource: "库房",
                    replacementReason: "故障"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 10. 胎压调整 (B-6666) - 完整流程 (Completed)
        {
            aircraftRegNo: "B-6666",
            aircraftType: "ARJ21-700",
            jobCardNo: "JC-2025-010",
            revision: 1,
            ataCode: "32-40",
            workType: "Service",
            location: "成都天府机场",
            workDescription: "航前检查发现右主轮气压偏低，充气至标准值。",
            referenceDocument: "AMM 32-41-00",
            usedParts: [],
            usedTools: ["TL-TIRE-GAUGE", "TL-NITROGEN-CART"],
            testMeasureData: [
                { testItemName: "充气后气压", measuredValues: "155 PSI", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "勤务J",
                performedById: "SVC001",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 2,
                inspectedByName: "检验员K",
                inspectedById: "INS-008",
                riiByName: "",
                riiById: "",
                releaseByName: "放行L",
                releaseById: "REL-005"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 11. 导航数据库更新 (B-7777) - 完整流程 (Completed)
        {
            aircraftRegNo: "B-7777",
            aircraftType: "C919",
            jobCardNo: "JC-2025-011",
            revision: 1,
            ataCode: "34-10",
            workType: "Database Update",
            location: "上海虹桥机场",
            workDescription: "更新 FMS 导航数据库至 Cycle 2501。",
            referenceDocument: "AMM 34-61-00",
            usedParts: [],
            usedTools: ["TL-USB-LOADER"],
            testMeasureData: [
                { testItemName: "数据库版本", measuredValues: "Cycle 2501 Active", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "电子M",
                performedById: "AV002",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 48,
                inspectedByName: "检验员N",
                inspectedById: "INS-009",
                riiByName: "",
                riiById: "",
                releaseByName: "放行O",
                releaseById: "REL-006"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 12. 货舱门封严检查 (B-8888) - 待互检 (Pending Peer Check)
        {
            aircraftRegNo: "B-8888",
            aircraftType: "A350-900",
            jobCardNo: "JC-2025-012",
            revision: 1,
            ataCode: "52-30",
            workType: "Inspection",
            location: "广州白云机场",
            workDescription: "检查后货舱门封严条是否有破损。",
            referenceDocument: "AMM 52-30-00",
            usedParts: [],
            usedTools: ["TL-LADDER"],
            testMeasureData: [
                { testItemName: "封严条状况", measuredValues: "完好", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "结构P",
                performedById: "STR001",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 3,
                inspectedByName: "",
                inspectedById: "",
                riiByName: "",
                riiById: "",
                releaseByName: "",
                releaseById: ""
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 13. 燃油箱沉淀排放 (B-9999) - 待放行 (Pending Release)
        {
            aircraftRegNo: "B-9999",
            aircraftType: "B787-9",
            jobCardNo: "JC-2025-013",
            revision: 1,
            ataCode: "28-10",
            workType: "Service",
            location: "昆明长水机场",
            workDescription: "执行燃油箱沉淀排放，检查是否有水分。",
            referenceDocument: "AMM 28-11-00",
            usedParts: [],
            usedTools: ["TL-BUCKET", "TL-TEST-KIT"],
            testMeasureData: [
                { testItemName: "水分测试", measuredValues: "无水分", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "勤务Q",
                performedById: "SVC002",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 6,
                inspectedByName: "检验员R",
                inspectedById: "INS-010",
                riiByName: "",
                riiById: "",
                releaseByName: "",
                releaseById: ""
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 14. 起落架润滑 (B-1010) - 完整流程 (Completed)
        {
            aircraftRegNo: "B-1010",
            aircraftType: "B777-300ER",
            jobCardNo: "JC-2025-014",
            revision: 1,
            ataCode: "32-00",
            workType: "Lubrication",
            location: "上海浦东机场",
            workDescription: "依据润滑图表对主起落架进行润滑。",
            referenceDocument: "AMM 32-00-00",
            usedParts: [],
            usedTools: ["TL-GREASE-GUN"],
            testMeasureData: [
                { testItemName: "润滑点检查", measuredValues: "油脂溢出正常", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "机械S",
                performedById: "MECH003",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 10,
                inspectedByName: "检验员T",
                inspectedById: "INS-011",
                riiByName: "",
                riiById: "",
                releaseByName: "放行U",
                releaseById: "REL-007"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 15. IDG 更换 (B-2020) - RII项目，完整流程 (Completed)
        {
            aircraftRegNo: "B-2020",
            aircraftType: "E190-E2",
            jobCardNo: "JC-2025-015",
            revision: 2,
            ataCode: "24-20",
            workType: "Component Replacement",
            location: "天津滨海机场",
            workDescription: "IDG 滑油温度高，更换 IDG。",
            referenceDocument: "AMM 24-21-00",
            usedParts: [
                { partNumber: "IDG-E190", serialNumber: "SN-IDG-888" }
            ],
            usedTools: ["TL-HOIST", "TL-WRENCH"],
            testMeasureData: [
                { testItemName: "电压频率测试", measuredValues: "115V / 400Hz", isPass: true }
            ],
            faultInfo: { fimCode: "24-20-00-810-802", faultDescription: "IDG High Temp" },
            signatures: {
                performedByName: "电气V",
                performedById: "ELEC004",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 30,
                inspectedByName: "检验员W",
                inspectedById: "INS-012",
                riiByName: "监察员X",
                riiById: "RII-004",
                releaseByName: "放行Y",
                releaseById: "REL-008"
            },
            replaceInfo: [
                {
                    removedPartNo: "IDG-E190",
                    removedSerialNo: "SN-IDG-OLD",
                    removedStatus: "过热",
                    installedPartNo: "IDG-E190",
                    installedSerialNo: "SN-IDG-888",
                    installedSource: "库房",
                    replacementReason: "故障"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        // 16. 飞控钢索张力调整 (B-3030) - RII项目，待必检 (Pending RII)
        {
            aircraftRegNo: "B-3030",
            aircraftType: "B737-800",
            jobCardNo: "JC-2025-016",
            revision: 1,
            ataCode: "27-10",
            workType: "Adjustment",
            location: "海口美兰机场",
            workDescription: "副翼操纵钢索张力超出限制，依据 AMM 进行调整。",
            referenceDocument: "AMM 27-11-00",
            usedParts: [],
            usedTools: ["TL-TENSIOMETER"],
            testMeasureData: [
                { testItemName: "钢索张力", measuredValues: "60 lbs (Temp 25C)", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "飞控Z",
                performedById: "FC005",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 5,
                inspectedByName: "检验员AA",
                inspectedById: "INS-013",
                riiByName: "监察员BB", // 预设 RII 人员
                riiById: "RII-005",
                releaseByName: "",
                releaseById: ""
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0,
            isRII: true,
            skipSignRII: true // 跳过 RII 签名，模拟 Pending RII 状态
        },
        // 17. 发动机吊点螺栓更换 (B-4040) - RII项目，待放行 (Pending Release)
        {
            aircraftRegNo: "B-4040",
            aircraftType: "A320neo",
            jobCardNo: "JC-2025-017",
            revision: 1,
            ataCode: "71-20",
            workType: "Component Replacement",
            location: "杭州萧山机场",
            workDescription: "例行检查发现发动机前吊点螺栓腐蚀，进行更换。",
            referenceDocument: "AMM 71-21-00",
            usedParts: [
                { partNumber: "BOLT-ENG-MNT", serialNumber: "Batch-2025-A" }
            ],
            usedTools: ["TL-TORQUE-WRENCH", "TL-HOIST"],
            testMeasureData: [
                { testItemName: "力矩校核", measuredValues: "450 Nm", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "结构CC",
                performedById: "STR002",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 8,
                inspectedByName: "检验员DD",
                inspectedById: "INS-014",
                riiByName: "监察员EE",
                riiById: "RII-006",
                releaseByName: "", // 待放行
                releaseById: ""
            },
            replaceInfo: [
                {
                    removedPartNo: "BOLT-ENG-MNT",
                    removedSerialNo: "Batch-2018",
                    removedStatus: "腐蚀",
                    installedPartNo: "BOLT-ENG-MNT",
                    installedSerialNo: "Batch-2025-A",
                    installedSource: "库房",
                    replacementReason: "腐蚀超标"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0,
            isRII: true
        },
        // 18. 起落架收放测试 (B-5050) - RII项目，完整流程 (Completed)
        {
            aircraftRegNo: "B-5050",
            aircraftType: "B787-9",
            jobCardNo: "JC-2025-018",
            revision: 2,
            ataCode: "32-30",
            workType: "Functional Check",
            location: "广州维修基地",
            workDescription: "更换起落架选择活门后，执行正常和备用收放测试。",
            referenceDocument: "AMM 32-31-00",
            usedParts: [
                { partNumber: "VALVE-LG-SEL", serialNumber: "SN-V-777" }
            ],
            usedTools: ["TL-HYD-MULE", "TL-JACKS"],
            testMeasureData: [
                { testItemName: "收上时间", measuredValues: "10s", isPass: true },
                { testItemName: "放下时间", measuredValues: "12s", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "液压FF",
                performedById: "HYD003",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 48,
                inspectedByName: "检验员GG",
                inspectedById: "INS-015",
                riiByName: "监察员HH",
                riiById: "RII-007",
                releaseByName: "放行II",
                releaseById: "REL-009"
            },
            replaceInfo: [
                {
                    removedPartNo: "VALVE-LG-SEL",
                    removedSerialNo: "SN-V-OLD",
                    removedStatus: "内漏",
                    installedPartNo: "VALVE-LG-SEL",
                    installedSerialNo: "SN-V-777",
                    installedSource: "库房",
                    replacementReason: "故障"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0,
            isRII: true
        },
        // 19. 全静压系统泄漏测试 (B-6060) - RII项目，待互检 (Pending Peer Check)
        {
            aircraftRegNo: "B-6060",
            aircraftType: "A330-300",
            jobCardNo: "JC-2025-019",
            revision: 1,
            ataCode: "34-10",
            workType: "Test",
            location: "成都双流机场",
            workDescription: "更换空速管后，执行全静压系统泄漏测试。",
            referenceDocument: "AMM 34-11-00",
            usedParts: [
                { partNumber: "PITOT-PROBE", serialNumber: "SN-PP-2025" }
            ],
            usedTools: ["TL-ADTS"],
            testMeasureData: [
                { testItemName: "静压泄漏率", measuredValues: "100 ft/min", isPass: true }
            ],
            faultInfo: { fimCode: "", faultDescription: "" },
            signatures: {
                performedByName: "电子JJ",
                performedById: "AV004",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 2,
                inspectedByName: "检验员KK", // 预设互检人员
                inspectedById: "INS-016",
                riiByName: "监察员LL", // 预设 RII 人员
                riiById: "RII-008",
                releaseByName: "",
                releaseById: ""
            },
            replaceInfo: [
                {
                    removedPartNo: "PITOT-PROBE",
                    removedSerialNo: "SN-PP-OLD",
                    removedStatus: "加温失效",
                    installedPartNo: "PITOT-PROBE",
                    installedSerialNo: "SN-PP-2025",
                    installedSource: "库房",
                    replacementReason: "故障"
                }
            ],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0,
            isRII: true,
            skipPeerCheck: true, // 跳过互检签名
            skipSignRII: true    // 必须同时跳过 RII 签名，否则会因状态不对而报错
        },
        // 20. 反推封存 (B-7070) - RII项目，完整流程 (Completed)
        {
            aircraftRegNo: "B-7070",
            aircraftType: "C919",
            jobCardNo: "JC-2025-020",
            revision: 1,
            ataCode: "78-30",
            workType: "Deactivation",
            location: "上海虹桥机场",
            workDescription: "左发反推故障，依据 MEL 进行封存锁定。",
            referenceDocument: "MEL 78-30-01",
            usedParts: [],
            usedTools: ["TL-LOCK-PIN"],
            testMeasureData: [
                { testItemName: "锁定状态确认", measuredValues: "已锁定", isPass: true }
            ],
            faultInfo: { fimCode: "78-30-00-810-805", faultDescription: "Reverser Unlock" },
            signatures: {
                performedByName: "机械MM",
                performedById: "MECH005",
                performTime: Math.floor(Date.now() / 1000) - 3600 * 20,
                inspectedByName: "检验员NN",
                inspectedById: "INS-017",
                riiByName: "监察员OO",
                riiById: "RII-009",
                releaseByName: "放行PP",
                releaseById: "REL-010"
            },
            replaceInfo: [],
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0,
            isRII: true
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
            const riiName = record.signatures.riiByName;
            const riiId = record.signatures.riiById;
            const releaserName = record.signatures.releaseByName;
            const releaserId = record.signatures.releaseById;
            
            // 随机决定是否为 RII 项目 (为了测试)
            // 或者根据数据中的 riiByName 是否存在来决定
            if (record.isRII === undefined) {
                record.isRII = !!(riiName && riiName !== "N/A");
            }

            const zeroAddr = "0x0000000000000000000000000000000000000000";
            record.signatures = {
                performedBy: zeroAddr,
                performedByName: record.signatures.performedByName,
                performedById: record.signatures.performedById, // 确保这里正确传递了工号
                performTime: record.signatures.performTime || Math.floor(Date.now() / 1000), // 使用预设时间或当前时间
                peerChecks: [], // 初始化为空数组
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

            // 3. 互检签名 (Sign Peer Check) - 使用 Inspector 钱包
            if (inspectorName && inspectorName !== "N/A" && !record.skipPeerCheck) {
                console.log(`   > 正在进行互检签名: ${inspectorName} (by Inspector Wallet)...`);
                const tx2 = await inspectorContract.signPeerCheck(record.recordId, inspectorName, inspectorId, { nonce: inspectorNonce });
                inspectorNonce++;
                await tx2.wait();
            }

            // 4. 必检签名 (Sign RII) - 使用 Inspector 钱包 (如果是 RII)
            if (record.isRII && riiName && riiName !== "N/A" && !record.skipSignRII) {
                console.log(`   > 正在进行必检签名: ${riiName} (by Inspector Wallet)...`);
                const txRII = await inspectorContract.signRII(record.recordId, riiName, riiId, { nonce: inspectorNonce });
                inspectorNonce++;
                await txRII.wait();
            }

            // 5. 放行签名 (Sign Release) - 使用 Owner 钱包 (或者 Inspector 钱包，这里演示用 Owner)
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
