// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AviationMaintenance {
    // ================= 结构体定义 =================

    struct PartInfo {
        string partNumber; // 件号
        string serialNumber; // 序号
    }

    struct TestMeasureData {
        string testItemName; // 实验项目名称
        string measuredValues; // 实测值
        bool isPass; // 是否合格
    }

    struct FaultInfo {
        string fimCode; // FIM代码
        string faultDescription; // 故障描述
    }

    struct Signatures {
        string performedBy; // 工作者
        uint256 performTime; // 工作时间
        string inspectedBy; // 互检人员
        string riiBy; // 必检项目检验员
        string releaseBy; // 放行人员
    }

    struct ReplaceInfo {
        string removedPartNo; // 拆下件号
        string removedSerialNo; // 拆下序号
        string removedStatus; // 拆下件状态
        string installedPartNo; // 装上件号
        string installedSerialNo; // 装上序号
        string installedSource; // 装上件来源
        string replacementReason; // 更换原因
    }

    // 主记录结构体
    struct MaintenanceRecord {
        string recordId; // 0. 记录唯一编号 (Hash)
        string aircraftRegNo; // 1. 飞机注册号
        string aircraftType; // 2. 机型
        string jobCardNo; // 3. 工作单编号
        uint256 revision; // 4. 版次
        string ataCode; // 5. ATA章节号
        string workType; // 6. 工作类型
        string location; // 7. 工作地点
        string workDescription; // 8. 工作内容描述
        string referenceDocument; // 9. 依据文件
        // 嵌套结构体
        PartInfo[] usedParts;
        string[] usedTools;
        TestMeasureData[] testMeasureData;
        FaultInfo faultInfo;
        Signatures signatures;
        ReplaceInfo[] replaceInfo;
        address recorder; // 记录人(区块链地址)
        uint256 timestamp; // 上链时间
    }

    // ================= 状态变量 =================

    address public owner; // 合约拥有者

    // 授权的节点列表
    mapping(address => bool) public authorizedNodes;

    // 存储所有记录: recordId => Record
    mapping(string => MaintenanceRecord) private records;

    // 索引: 飞机注册号 => 记录ID列表
    mapping(string => string[]) private aircraftRecords;

    // 索引: 工卡号 => 记录ID列表
    mapping(string => string[]) private jobCardRecords;

    // 索引: 机械师(工作者) => 记录ID列表
    mapping(string => string[]) private mechanicRecords;

    // 记录是否存在
    mapping(string => bool) public recordExists;

    // ================= 事件 =================

    event RecordAdded(
        string indexed recordId,
        string indexed aircraftRegNo,
        string indexed jobCardNo
    );
    event NodeAuthorized(address node, bool status);

    // ================= 修饰符 =================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedNodes[msg.sender], "Not an authorized node");
        _;
    }

    // ================= 函数 =================

    constructor() {
        owner = msg.sender;
        authorizedNodes[msg.sender] = true;
    }

    function setNodeAuthorization(
        address _node,
        bool _status
    ) public onlyOwner {
        authorizedNodes[_node] = _status;
        emit NodeAuthorized(_node, _status);
    }

    // 添加检修记录
    function addRecord(MaintenanceRecord memory _record) public onlyAuthorized {
        require(!recordExists[_record.recordId], "Record ID already exists");

        MaintenanceRecord storage newRecord = records[_record.recordId];

        newRecord.recordId = _record.recordId;
        newRecord.aircraftRegNo = _record.aircraftRegNo;
        newRecord.aircraftType = _record.aircraftType;
        newRecord.jobCardNo = _record.jobCardNo;
        newRecord.revision = _record.revision;
        newRecord.ataCode = _record.ataCode;
        newRecord.workType = _record.workType;
        newRecord.location = _record.location;
        newRecord.workDescription = _record.workDescription;
        newRecord.referenceDocument = _record.referenceDocument;
        newRecord.faultInfo = _record.faultInfo;
        newRecord.signatures = _record.signatures;
        newRecord.recorder = msg.sender;
        newRecord.timestamp = block.timestamp;

        for (uint i = 0; i < _record.usedParts.length; i++) {
            newRecord.usedParts.push(_record.usedParts[i]);
        }
        for (uint i = 0; i < _record.usedTools.length; i++) {
            newRecord.usedTools.push(_record.usedTools[i]);
        }
        for (uint i = 0; i < _record.testMeasureData.length; i++) {
            newRecord.testMeasureData.push(_record.testMeasureData[i]);
        }
        for (uint i = 0; i < _record.replaceInfo.length; i++) {
            newRecord.replaceInfo.push(_record.replaceInfo[i]);
        }

        // 更新索引
        aircraftRecords[_record.aircraftRegNo].push(_record.recordId);
        jobCardRecords[_record.jobCardNo].push(_record.recordId);
        mechanicRecords[_record.signatures.performedBy].push(_record.recordId);
        recordExists[_record.recordId] = true;

        emit RecordAdded(
            _record.recordId,
            _record.aircraftRegNo,
            _record.jobCardNo
        );
    }

    // 1. 根据 Record ID 查询详情
    function getRecordById(
        string memory _recordId
    ) public view returns (MaintenanceRecord memory) {
        require(recordExists[_recordId], "Record not found");
        return records[_recordId];
    }

    // 2. 根据飞机注册号查询所有 Record ID
    function getRecordIdsByAircraft(
        string memory _aircraftRegNo
    ) public view returns (string[] memory) {
        return aircraftRecords[_aircraftRegNo];
    }

    // 3. 根据工卡号查询所有 Record ID
    function getRecordIdsByJobCard(
        string memory _jobCardNo
    ) public view returns (string[] memory) {
        return jobCardRecords[_jobCardNo];
    }

    // 4. 根据机械师(工作者)查询所有 Record ID
    function getRecordIdsByMechanic(
        string memory _mechanic
    ) public view returns (string[] memory) {
        return mechanicRecords[_mechanic];
    }
}
