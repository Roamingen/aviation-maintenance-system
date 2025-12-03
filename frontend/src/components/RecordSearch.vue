<template>
  <div class="record-search">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>检修记录查询</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 按工作单号查询 (Hash) -->
        <el-tab-pane label="按工作单号查询 (Hash)" name="recordId">
          <div class="search-input">
            <el-input v-model="searchRecordId" placeholder="请输入工作单号 (Hash)" clearable @keyup.enter="searchByRecordId">
              <template #append>
                <el-button @click="searchByRecordId">查询</el-button>
              </template>
            </el-input>
          </div>

          <div v-if="recordResult" class="result-area">
            <el-descriptions title="记录详情" border :column="2">
              <el-descriptions-item label="工卡号" :span="2">
                <el-tooltip :content="recordResult.recordId" placement="top">
                  <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ recordResult.recordId }}</el-tag>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="飞机号">{{ recordResult.aircraftRegNo }}</el-descriptions-item>
              <el-descriptions-item label="机型">{{ recordResult.aircraftType }}</el-descriptions-item>
              <el-descriptions-item label="工作类型">{{ recordResult.workType }}</el-descriptions-item>
              <el-descriptions-item label="工作地点">{{ recordResult.location }}</el-descriptions-item>
              <el-descriptions-item label="记录人地址">
                 <el-tooltip :content="recordResult.recorder" placement="top">
                    <span>{{ recordResult.recorder }}</span>
                 </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="工作描述" :span="2">{{ recordResult.workDescription }}</el-descriptions-item>
              <el-descriptions-item label="消耗件" :span="2">
                <div v-for="(part, idx) in recordResult.usedParts" :key="idx">
                  {{ part.partNumber }} (SN: {{ part.serialNumber }})
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="工具" :span="2">
                <div v-for="(tool, idx) in recordResult.usedTools" :key="idx">
                  {{ tool }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="测试数据" :span="2">
                <div v-for="(data, idx) in recordResult.testMeasureData" :key="idx">
                  <strong>{{ data.testItemName }}:</strong> {{ data.measuredValues }} 
                  <el-tag size="small" :type="data.isPass ? 'success' : 'danger'">{{ data.isPass ? '合格' : '不合格' }}</el-tag>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="更换件" :span="2" v-if="recordResult.replaceInfo && recordResult.replaceInfo.length">
                 <div v-for="(info, idx) in recordResult.replaceInfo" :key="idx" style="margin-bottom: 5px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                    <div><el-tag size="small" type="danger">拆</el-tag> {{ info.removedPartNo }} (SN: {{ info.removedSerialNo }}) - 状态: {{ info.removedStatus }}</div>
                    <div><el-tag size="small" type="success">装</el-tag> {{ info.installedPartNo }} (SN: {{ info.installedSerialNo }}) - 来源: {{ info.installedSource }}</div>
                    <div style="color: #666; font-size: 0.9em;">原因: {{ info.replacementReason }}</div>
                 </div>
              </el-descriptions-item>
              <el-descriptions-item label="工作者">{{ recordResult.signatures?.performedBy }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- 按飞机号查询 -->
        <el-tab-pane label="按飞机号查询" name="aircraft">
          <div class="search-input">
            <el-input v-model="searchRegNo" placeholder="请输入飞机注册号 (例如 B-1234)" clearable @keyup.enter="searchByAircraft">
              <template #append>
                <el-button @click="searchByAircraft">查询</el-button>
              </template>
            </el-input>
          </div>

          <!-- 筛选区域 -->
          <div v-if="aircraftRecords.length > 0" class="filter-area">
             <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="filterRecords"
              />
          </div>

          <div v-if="filteredAircraftRecords.length > 0" class="result-list">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in filteredAircraftRecords"
                :key="index"
                :timestamp="formatTimestamp(record.timestamp)"
                placement="top"
              >
                <el-card>
                  <div class="card-header-flex">
                    <h4>{{ record.workType }} <span style="font-size: 0.8em; color: #909399; font-weight: normal;">#{{ record.recordId.slice(0, 8) }}...</span></h4>
                    <el-button type="primary" link @click="toggleExpand(record)">
                      {{ record.expanded ? '收起详情' : '查看详情' }}
                    </el-button>
                  </div>
                  
                  <!-- 展开的详情区域 -->
                  <div v-if="record.expanded" class="expanded-detail">
                    <el-divider style="margin: 10px 0;" />
                    <el-descriptions :column="2" size="small" border>
                      <el-descriptions-item label="工卡号" :span="2">
                        <el-tooltip :content="record.recordId" placement="top">
                            <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ record.recordId }}</el-tag>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="飞机号">{{ record.aircraftRegNo }}</el-descriptions-item>
                      <el-descriptions-item label="机型">{{ record.aircraftType }}</el-descriptions-item>
                      <el-descriptions-item label="工作类型">{{ record.workType }}</el-descriptions-item>
                      <el-descriptions-item label="工作地点">{{ record.location }}</el-descriptions-item>
                      <el-descriptions-item label="记录人地址">
                        <el-tooltip :content="record.recorder" placement="top">
                            <span>{{ record.recorder }}</span>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作描述" :span="2">{{ record.workDescription }}</el-descriptions-item>
                      <el-descriptions-item label="消耗件" :span="2">
                        <div v-for="(part, idx) in record.usedParts" :key="idx">
                          {{ part.partNumber }} (SN: {{ part.serialNumber }})
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="工具" :span="2">
                        <div v-for="(tool, idx) in record.usedTools" :key="idx">
                          {{ tool }}
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="测试数据" :span="2">
                        <div v-for="(data, idx) in record.testMeasureData" :key="idx">
                          <strong>{{ data.testItemName }}:</strong> {{ data.measuredValues }} 
                          <el-tag size="small" :type="data.isPass ? 'success' : 'danger'">{{ data.isPass ? '合格' : '不合格' }}</el-tag>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="更换件" :span="2" v-if="record.replaceInfo && record.replaceInfo.length">
                         <div v-for="(info, idx) in record.replaceInfo" :key="idx" style="margin-bottom: 5px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                            <div><el-tag size="small" type="danger">拆</el-tag> {{ info.removedPartNo }} (SN: {{ info.removedSerialNo }}) - 状态: {{ info.removedStatus }}</div>
                            <div><el-tag size="small" type="success">装</el-tag> {{ info.installedPartNo }} (SN: {{ info.installedSerialNo }}) - 来源: {{ info.installedSource }}</div>
                            <div style="color: #666; font-size: 0.9em;">原因: {{ info.replacementReason }}</div>
                         </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作者">{{ record.signatures?.performedBy }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else-if="searchedAircraft" description="暂无记录 (或被筛选过滤)" />
        </el-tab-pane>

        <!-- 按机械师查询 -->
        <el-tab-pane label="按机械师查询" name="mechanic">
          <div class="search-input">
            <el-input v-model="searchMechanic" placeholder="请输入机械师姓名" clearable @keyup.enter="searchByMechanic">
              <template #append>
                <el-button @click="searchByMechanic">查询</el-button>
              </template>
            </el-input>
          </div>

           <!-- 筛选区域 -->
          <div v-if="mechanicRecords.length > 0" class="filter-area">
             <el-date-picker
                v-model="mechanicDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="filterMechanicRecords"
              />
          </div>

          <div v-if="filteredMechanicRecords.length > 0" class="result-list">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in filteredMechanicRecords"
                :key="index"
                :timestamp="formatTimestamp(record.timestamp)"
                placement="top"
              >
                <el-card>
                  <div class="card-header-flex">
                    <h4>{{ record.workType }} <span style="font-size: 0.8em; color: #909399; font-weight: normal;">#{{ record.recordId.slice(0, 8) }}...</span></h4>
                    <el-button type="primary" link @click="toggleExpand(record)">
                      {{ record.expanded ? '收起详情' : '查看详情' }}
                    </el-button>
                  </div>
                  
                  <!-- 展开的详情区域 -->
                  <div v-if="record.expanded" class="expanded-detail">
                    <el-divider style="margin: 10px 0;" />
                    <el-descriptions :column="2" size="small" border>
                      <el-descriptions-item label="工卡号" :span="2">
                        <el-tooltip :content="record.recordId" placement="top">
                            <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ record.recordId }}</el-tag>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="飞机号">{{ record.aircraftRegNo }}</el-descriptions-item>
                      <el-descriptions-item label="机型">{{ record.aircraftType }}</el-descriptions-item>
                      <el-descriptions-item label="工作类型">{{ record.workType }}</el-descriptions-item>
                      <el-descriptions-item label="工作地点">{{ record.location }}</el-descriptions-item>
                      <el-descriptions-item label="记录人地址">
                        <el-tooltip :content="record.recorder" placement="top">
                            <span>{{ record.recorder }}</span>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作描述" :span="2">{{ record.workDescription }}</el-descriptions-item>
                      <el-descriptions-item label="消耗件" :span="2">
                        <div v-for="(part, idx) in record.usedParts" :key="idx">
                          {{ part.partNumber }} (SN: {{ part.serialNumber }})
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="工具" :span="2">
                        <div v-for="(tool, idx) in record.usedTools" :key="idx">
                          {{ tool }}
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="测试数据" :span="2">
                        <div v-for="(data, idx) in record.testMeasureData" :key="idx">
                          <strong>{{ data.testItemName }}:</strong> {{ data.measuredValues }} 
                          <el-tag size="small" :type="data.isPass ? 'success' : 'danger'">{{ data.isPass ? '合格' : '不合格' }}</el-tag>
                        </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="更换件" :span="2" v-if="record.replaceInfo && record.replaceInfo.length">
                         <div v-for="(info, idx) in record.replaceInfo" :key="idx" style="margin-bottom: 5px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                            <div><el-tag size="small" type="danger">拆</el-tag> {{ info.removedPartNo }} (SN: {{ info.removedSerialNo }}) - 状态: {{ info.removedStatus }}</div>
                            <div><el-tag size="small" type="success">装</el-tag> {{ info.installedPartNo }} (SN: {{ info.installedSerialNo }}) - 来源: {{ info.installedSource }}</div>
                            <div style="color: #666; font-size: 0.9em;">原因: {{ info.replacementReason }}</div>
                         </div>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作者">{{ record.signatures?.performedBy }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else-if="searchedMechanic" description="暂无记录 (或被筛选过滤)" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const activeTab = ref('recordId')
const searchRecordId = ref('')
const searchRegNo = ref('')
const searchMechanic = ref('')

const recordResult = ref(null)

// 飞机号查询相关
const aircraftRecords = ref([])
const searchedAircraft = ref(false)
const dateRange = ref(null)
const filteredAircraftRecords = computed(() => {
    if (!dateRange.value || dateRange.value.length !== 2) {
        return aircraftRecords.value
    }
    const start = dateRange.value[0].getTime() / 1000
    const end = dateRange.value[1].getTime() / 1000 + 86400 // 包含当天
    return aircraftRecords.value.filter(r => {
        const ts = Number(r.timestamp)
        return ts >= start && ts < end
    })
})

// 机械师查询相关
const mechanicRecords = ref([])
const searchedMechanic = ref(false)
const mechanicDateRange = ref(null)
const filteredMechanicRecords = computed(() => {
    if (!mechanicDateRange.value || mechanicDateRange.value.length !== 2) {
        return mechanicRecords.value
    }
    const start = mechanicDateRange.value[0].getTime() / 1000
    const end = mechanicDateRange.value[1].getTime() / 1000 + 86400
    return mechanicRecords.value.filter(r => {
        const ts = Number(r.timestamp)
        return ts >= start && ts < end
    })
})


// 按记录编号查询
const searchByRecordId = async () => {
  if (!searchRecordId.value) return
  try {
    const res = await axios.get(`http://localhost:3000/api/record/${searchRecordId.value}`)
    if (res.data.success) {
      recordResult.value = res.data.data
    } else {
      ElMessage.warning('未找到该记录')
      recordResult.value = null
    }
  } catch (error) {
    ElMessage.error('查询失败: ' + (error.response?.data?.error || error.message))
  }
}

// 按飞机号查询
const searchByAircraft = async () => {
  if (!searchRegNo.value) return
  searchedAircraft.value = true
  try {
    const res = await axios.get(`http://localhost:3000/api/aircraft/${searchRegNo.value}`)
    if (res.data.success) {
      // 为每条记录添加 expanded 状态控制
      aircraftRecords.value = res.data.data.map(r => ({ ...r, expanded: false }))
    } else {
      aircraftRecords.value = []
    }
  } catch (error) {
    ElMessage.error('查询失败')
  }
}

// 按机械师查询
const searchByMechanic = async () => {
  if (!searchMechanic.value) return
  searchedMechanic.value = true
  try {
    const res = await axios.get(`http://localhost:3000/api/mechanic/${searchMechanic.value}`)
    if (res.data.success) {
      mechanicRecords.value = res.data.data.map(r => ({ ...r, expanded: false }))
    } else {
      mechanicRecords.value = []
    }
  } catch (error) {
    ElMessage.error('查询失败')
  }
}

const toggleExpand = (record) => {
  record.expanded = !record.expanded
}

const formatTimestamp = (ts) => {
  if (!ts) return ''
  // 区块链返回的是 BigInt 字符串或数字，单位秒
  const date = new Date(Number(ts) * 1000)
  return date.toLocaleString()
}

const filterRecords = () => {
    // 触发 computed 更新
}
const filterMechanicRecords = () => {
    // 触发 computed 更新
}
</script>

<style scoped>
.record-search {
  max-width: 800px;
  margin: 0 auto;
}
.search-input {
  margin-bottom: 20px;
  max-width: 500px;
}
.result-area {
  margin-top: 20px;
}
.filter-area {
    margin-bottom: 20px;
}
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header-flex h4 {
  margin: 0;
}
.expanded-detail {
  margin-top: 10px;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}
</style>
