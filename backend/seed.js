const { contract } = require('./config');
const { ethers } = require("ethers");

async function main() {
    console.log("🚀 开始预填充测试数据...");

    const sampleRecords = [
        {
            // recordId 会在循环中生成
            aircraftRegNo: "B-1234",
            aircraftType: "B737-800",
            jobCardNo: "JC-2025-001",
            revision: 1,
            ataCode: "32",
            workType: "Scheduled Check",
            location: "Beijing Base",
            workDescription: "更换左主起落架轮胎",
            referenceDocument: "AMM 32-45-00",
            partToolList: {
                partNumber: "GY-737-TIRE",
                serialNumber: "SN-998877",
                toolNumber: "TL-001"
            },
            testMeasureData: {
                measuredValues: "200 PSI",
                isPass: true
            },
            faultInfo: {
                fimCode: "",
                faultDescription: ""
            },
            signatures: {
                performedBy: "张三 (001)",
                performTime: Math.floor(Date.now() / 1000),
                inspectedBy: "李四",
                riiBy: "",
                releaseBy: "王五"
            },
            replaceInfo: {
                removedPartNo: "GY-737-TIRE",
                removedSerialNo: "SN-112233",
                removedStatus: "磨损超标",
                installedPartNo: "GY-737-TIRE",
                installedSerialNo: "SN-998877",
                installedSource: "库房",
                replacementReason: "例行更换"
            },
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        },
        {
            aircraftRegNo: "B-5678",
            aircraftType: "A320neo",
            jobCardNo: "JC-2025-002",
            revision: 1,
            ataCode: "21",
            workType: "Troubleshooting",
            location: "Guangzhou Base",
            workDescription: "空调组件故障排查，更换热交换器",
            referenceDocument: "TSM 21-50-00",
            partToolList: {
                partNumber: "HE-320-01",
                serialNumber: "SN-556677",
                toolNumber: "TL-005"
            },
            testMeasureData: {
                measuredValues: "Temp Diff: 15C",
                isPass: true
            },
            faultInfo: {
                fimCode: "21-50-00-810-801",
                faultDescription: "驾驶舱温度无法调节"
            },
            signatures: {
                performedBy: "Mike (002)",
                performTime: Math.floor(Date.now() / 1000) - 86400, // 昨天
                inspectedBy: "Sarah",
                riiBy: "",
                releaseBy: "Tom"
            },
            replaceInfo: {
                removedPartNo: "HE-320-01",
                removedSerialNo: "SN-111111",
                removedStatus: "内部堵塞",
                installedPartNo: "HE-320-01",
                installedSerialNo: "SN-556677",
                installedSource: "库房",
                replacementReason: "故障更换"
            },
            recorder: "0x0000000000000000000000000000000000000000",
            timestamp: 0
        }
    ];

    for (const record of sampleRecords) {
        try {
            // 生成 Hash ID
            const uniqueString = `${record.jobCardNo}-${Date.now()}-${Math.random()}`;
            record.recordId = ethers.id(uniqueString);

            console.log(`📝 正在添加记录: ${record.jobCardNo} (ID: ${record.recordId})...`);
            const tx = await contract.addRecord(record);
            await tx.wait();
            console.log(`✅ 成功添加: ${record.jobCardNo}`);
        } catch (error) {
            if (error.reason && error.reason.includes("already exists")) {
                console.log(`⚠️ 记录已存在: ${record.jobCardNo}`);
            } else {
                console.error(`❌ 添加失败 ${record.jobCardNo}:`, error.reason || error.message);
            }
        }
    }
    
    console.log("🎉 数据预填充完成！");
}

main();
