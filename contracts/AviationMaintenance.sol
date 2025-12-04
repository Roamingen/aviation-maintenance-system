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

    struct PeerCheckSignature {
        address inspector;
        string name;
        string id;
        uint256 time;
    }

    enum RecordStatus {
        Pending,
        Released
    }

    struct Signatures {
        address performedBy; // 工作者地址 (0x...)
        string performedByName; // 工作者姓名
        string performedById; // 工作者工号 (新增)
        uint256 performTime; // 工作时间
        PeerCheckSignature[] peerChecks; // 互检人员列表 (支持多人)
        address riiBy; // 必检人员地址
        string riiByName; // 必检人员姓名
        string riiById; // 必检人员工号 (新增)
        address releaseBy; // 放行人员地址
        string releaseByName; // 放行人员姓名
        string releaseById; // 放行人员工号 (新增)
        uint256 releaseTime; // 放行时间
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
        bool isRII; // 10. 是否为必检项目 (新增)
        // 嵌套结构体
        PartInfo[] usedParts;
        string[] usedTools;
        TestMeasureData[] testMeasureData;
        FaultInfo faultInfo;
        Signatures signatures;
        ReplaceInfo[] replaceInfo;
        address recorder; // 记录人(区块链地址)
        uint256 timestamp; // 上链时间
        RecordStatus status; // 记录状态
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

    // 存储所有记录ID列表 (用于遍历)
    string[] private allRecordIds;

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

    // 添加检修记录 (工作者签名)
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
        newRecord.isRII = _record.isRII; // 保存 RII 状态
        newRecord.faultInfo = _record.faultInfo;

        // 强制使用 msg.sender 作为工作者地址
        newRecord.signatures.performedBy = msg.sender;
        newRecord.signatures.performedByName = _record
            .signatures
            .performedByName;
        newRecord.signatures.performedById = _record.signatures.performedById; // 保存工号
        newRecord.signatures.performTime = _record.signatures.performTime; // 使用传入的时间作为工作时间

        // 初始化其他签名为空
        // peerChecks 默认为空数组，无需显式初始化

        newRecord.signatures.riiBy = address(0);
        newRecord.signatures.riiByName = "";
        newRecord.signatures.riiById = "";
        newRecord.signatures.releaseBy = address(0);
        newRecord.signatures.releaseByName = "";
        newRecord.signatures.releaseById = "";
        newRecord.signatures.releaseTime = 0;

        newRecord.recorder = msg.sender;
        newRecord.timestamp = block.timestamp;
        newRecord.status = RecordStatus.Pending;

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
        mechanicRecords[_record.signatures.performedById].push(
            _record.recordId
        ); // 使用工号索引
        allRecordIds.push(_record.recordId); // 添加到总列表
        recordExists[_record.recordId] = true;

        emit RecordAdded(
            _record.recordId,
            _record.aircraftRegNo,
            _record.jobCardNo
        );
    }

    // 互检人员签名 (Peer Check)
    function signPeerCheck(
        string memory _recordId,
        string memory _name,
        string memory _empId
    ) public onlyAuthorized {
        require(recordExists[_recordId], "Record not found");
        MaintenanceRecord storage r = records[_recordId];
        require(r.status == RecordStatus.Pending, "Record already released");
        require(
            r.signatures.performedBy != msg.sender,
            "Inspector cannot be performer"
        );

        // 检查是否已经签过名
        for (uint i = 0; i < r.signatures.peerChecks.length; i++) {
            require(
                r.signatures.peerChecks[i].inspector != msg.sender,
                "Already signed peer check"
            );
        }

        r.signatures.peerChecks.push(
            PeerCheckSignature({
                inspector: msg.sender,
                name: _name,
                id: _empId,
                time: block.timestamp
            })
        );
    }

    // 必检人员签名 (RII)
    function signRII(
        string memory _recordId,
        string memory _name,
        string memory _empId
    ) public onlyAuthorized {
        require(recordExists[_recordId], "Record not found");
        MaintenanceRecord storage r = records[_recordId];
        require(r.status == RecordStatus.Pending, "Record already released");
        require(r.isRII, "Not an RII record");
        require(
            r.signatures.performedBy != msg.sender,
            "RII Inspector cannot be performer"
        );

        r.signatures.riiBy = msg.sender;
        r.signatures.riiByName = _name;
        r.signatures.riiById = _empId;
    }

    // 放行人员签名 (最终放行)
    function signRelease(
        string memory _recordId,
        string memory _name,
        string memory _empId
    ) public onlyAuthorized {
        require(recordExists[_recordId], "Record not found");
        MaintenanceRecord storage r = records[_recordId];
        require(r.status == RecordStatus.Pending, "Record already released");

        // 如果是 RII 项目，必须先有 RII 签名
        if (r.isRII) {
            require(
                r.signatures.riiBy != address(0),
                "RII signature required before release"
            );
        }

        r.signatures.releaseBy = msg.sender;
        r.signatures.releaseByName = _name;
        r.signatures.releaseById = _empId;
        r.signatures.releaseTime = block.timestamp;
        r.status = RecordStatus.Released;
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

    // 4. 根据机械师工号查询所有 Record ID
    function getRecordIdsByMechanic(
        string memory _mechanicId
    ) public view returns (string[] memory) {
        return mechanicRecords[_mechanicId];
    }

    // 5. 获取记录总数
    function getRecordCount() public view returns (uint256) {
        return allRecordIds.length;
    }

    // 6. 分页获取 Record ID (倒序：最新的在前)
    function getRecordIdsByPage(
        uint256 _page,
        uint256 _pageSize
    ) public view returns (string[] memory) {
        uint256 total = allRecordIds.length;
        if (total == 0 || _pageSize == 0) {
            return new string[](0);
        }

        uint256 skip = (_page - 1) * _pageSize;
        if (skip >= total) {
            return new string[](0);
        }

        uint256 remaining = total - skip;
        uint256 count = remaining < _pageSize ? remaining : _pageSize;

        string[] memory pageIds = new string[](count);

        // 倒序遍历：从 total - 1 - skip 开始
        for (uint256 i = 0; i < count; i++) {
            pageIds[i] = allRecordIds[total - 1 - skip - i];
        }

        return pageIds;
    }
}
