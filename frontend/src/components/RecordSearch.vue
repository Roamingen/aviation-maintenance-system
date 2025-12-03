<template>
  <div class="record-search">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>检修记录查询</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 按记录编号查询 (Hash) -->
        <el-tab-pane label="按记录编号查询 (Record ID)" name="recordId">
          <div class="search-input">
            <el-input v-model="searchRecordId" placeholder="请输入记录编号 (Hash)" clearable @keyup.enter="searchByRecordId">
              <template #append>
                <el-button @click="searchByRecordId">查询</el-button>
              </template>
            </el-input>
          </div>

          <div v-if="recordResult" class="result-area">
            <el-descriptions title="记录详情" border :column="2">
              <el-descriptions-item label="记录编号" :span="2">
                <el-tooltip :content="recordResult.recordId" placement="top">
                  <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ recordResult.recordId }}</el-tag>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="飞机号">{{ recordResult.aircraftRegNo }}</el-descriptions-item>
              <el-descriptions-item label="机型">{{ recordResult.aircraftType }}</el-descriptions-item>
              <el-descriptions-item label="工卡号">{{ recordResult.jobCardNo }}</el-descriptions-item>
              <el-descriptions-item label="工作类型">{{ recordResult.workType }}</el-descriptions-item>
              <el-descriptions-item label="工作地点">{{ recordResult.location }}</el-descriptions-item>
              <el-descriptions-item label="记录人地址">
                 <el-tooltip :content="recordResult.recorder" placement="top">
                    <span>{{ recordResult.recorder }}</span>
                 </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="工作描述" :span="2">{{ recordResult.workDescription }}</el-descriptions-item>
              <el-descriptions-item label="实测值">{{ recordResult.testMeasureData?.measuredValues }}</el-descriptions-item>
              <el-descriptions-item label="合格状态">
                <el-tag :type="recordResult.testMeasureData?.isPass ? 'success' : 'danger'">
                  {{ recordResult.testMeasureData?.isPass ? '合格' : '不合格' }}
                </el-tag>
              </el-descriptions-item>
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
                    <h4>{{ record.workType }} - {{ record.jobCardNo }}</h4>
                    <el-button type="primary" link @click="toggleExpand(record)">
                      {{ record.expanded ? '收起详情' : '查看详情' }}
                    </el-button>
                  </div>
                  
                  <!-- 展开的详情区域 -->
                  <div v-if="record.expanded" class="expanded-detail">
                    <el-divider style="margin: 10px 0;" />
                    <el-descriptions :column="2" size="small" border>
                      <el-descriptions-item label="记录编号" :span="2">
                        <el-tooltip :content="record.recordId" placement="top">
                            <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ record.recordId }}</el-tag>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="飞机号">{{ record.aircraftRegNo }}</el-descriptions-item>
                      <el-descriptions-item label="机型">{{ record.aircraftType }}</el-descriptions-item>
                      <el-descriptions-item label="工卡号">{{ record.jobCardNo }}</el-descriptions-item>
                      <el-descriptions-item label="工作类型">{{ record.workType }}</el-descriptions-item>
                      <el-descriptions-item label="工作地点">{{ record.location }}</el-descriptions-item>
                      <el-descriptions-item label="记录人地址">
                        <el-tooltip :content="record.recorder" placement="top">
                            <span>{{ record.recorder }}</span>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作描述" :span="2">{{ record.workDescription }}</el-descriptions-item>
                      <el-descriptions-item label="实测值">{{ record.testMeasureData?.measuredValues }}</el-descriptions-item>
                      <el-descriptions-item label="合格状态">
                        <el-tag :type="record.testMeasureData?.isPass ? 'success' : 'danger'">
                          {{ record.testMeasureData?.isPass ? '合格' : '不合格' }}
                        </el-tag>
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

        <!-- 按工卡号查询 -->
        <el-tab-pane label="按工卡号查询" name="jobcard">
          <div class="search-input">
            <el-input v-model="searchJobCardNo" placeholder="请输入工卡号" clearable @keyup.enter="searchByJobCard">
              <template #append>
                <el-button @click="searchByJobCard">查询</el-button>
              </template>
            </el-input>
          </div>

           <!-- 筛选区域 -->
          <div v-if="jobCardRecords.length > 0" class="filter-area">
             <el-date-picker
                v-model="jobCardDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="filterJobCardRecords"
              />
          </div>

          <div v-if="filteredJobCardRecords.length > 0" class="result-list">
            <el-timeline>
              <el-timeline-item
                v-for="(record, index) in filteredJobCardRecords"
                :key="index"
                :timestamp="formatTimestamp(record.timestamp)"
                placement="top"
              >
                <el-card>
                  <div class="card-header-flex">
                    <h4>{{ record.aircraftRegNo }} - {{ record.workType }}</h4>
                    <el-button type="primary" link @click="toggleExpand(record)">
                      {{ record.expanded ? '收起详情' : '查看详情' }}
                    </el-button>
                  </div>
                  
                  <!-- 展开的详情区域 -->
                  <div v-if="record.expanded" class="expanded-detail">
                    <el-divider style="margin: 10px 0;" />
                    <el-descriptions :column="2" size="small" border>
                      <el-descriptions-item label="记录编号" :span="2">
                         <el-tooltip :content="record.recordId" placement="top">
                            <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ record.recordId }}</el-tag>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="飞机号">{{ record.aircraftRegNo }}</el-descriptions-item>
                      <el-descriptions-item label="机型">{{ record.aircraftType }}</el-descriptions-item>
                      <el-descriptions-item label="工卡号">{{ record.jobCardNo }}</el-descriptions-item>
                      <el-descriptions-item label="工作类型">{{ record.workType }}</el-descriptions-item>
                      <el-descriptions-item label="工作地点">{{ record.location }}</el-descriptions-item>
                      <el-descriptions-item label="记录人地址">
                        <el-tooltip :content="record.recorder" placement="top">
                            <span>{{ record.recorder }}</span>
                        </el-tooltip>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作描述" :span="2">{{ record.workDescription }}</el-descriptions-item>
                      <el-descriptions-item label="实测值">{{ record.testMeasureData?.measuredValues }}</el-descriptions-item>
                      <el-descriptions-item label="合格状态">
                        <el-tag :type="record.testMeasureData?.isPass ? 'success' : 'danger'">
                          {{ record.testMeasureData?.isPass ? '合格' : '不合格' }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="工作者">{{ record.signatures?.performedBy }}</el-descriptions-item>
                    </el-descriptions>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else-if="searchedJobCard" description="暂无记录 (或被筛选过滤)" />
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
const searchJobCardNo = ref('')

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

// 工卡号查询相关
const jobCardRecords = ref([])
const searchedJobCard = ref(false)
const jobCardDateRange = ref(null)
const filteredJobCardRecords = computed(() => {
    if (!jobCardDateRange.value || jobCardDateRange.value.length !== 2) {
        return jobCardRecords.value
    }
    const start = jobCardDateRange.value[0].getTime() / 1000
    const end = jobCardDateRange.value[1].getTime() / 1000 + 86400
    return jobCardRecords.value.filter(r => {
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

// 按工卡号查询
const searchByJobCard = async () => {
  if (!searchJobCardNo.value) return
  searchedJobCard.value = true
  try {
    const res = await axios.get(`http://localhost:3000/api/jobcard/${searchJobCardNo.value}`)
    if (res.data.success) {
      jobCardRecords.value = res.data.data.map(r => ({ ...r, expanded: false }))
    } else {
      jobCardRecords.value = []
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
const filterJobCardRecords = () => {
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
