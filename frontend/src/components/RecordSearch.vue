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
            <RecordDetailCard 
                :record="recordResult" 
                :expanded="true"
                :show-expand="false"
                :always-expanded="true"
                @refresh="searchByRecordId"
            />
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
                :timestamp="formatTimestamp(record.signatures.performTime)"
                placement="top"
              >
                <RecordDetailCard 
                    :record="record" 
                    :expanded="record.expanded"
                    @toggle-expand="toggleExpand(record)"
                    @refresh="searchByAircraft"
                />
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else-if="searchedAircraft" description="暂无记录 (或被筛选过滤)" />
        </el-tab-pane>

        <!-- 按工作者工号查询 -->
        <el-tab-pane label="按工作者工号查询" name="mechanic">
          <div class="search-input">
            <el-input v-model="searchMechanic" placeholder="请输入工作者工号" clearable @keyup.enter="searchByMechanic">
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
                :timestamp="formatTimestamp(record.signatures.performTime)"
                placement="top"
              >
                <RecordDetailCard 
                    :record="record" 
                    :expanded="record.expanded"
                    @toggle-expand="toggleExpand(record)"
                    @refresh="searchByMechanic"
                />
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
import RecordDetailCard from './RecordDetailCard.vue'

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
        // 筛选使用手动填写的工作时间 (performTime)
        const ts = Number(r.signatures.performTime)
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
        // 筛选使用手动填写的工作时间 (performTime)
        const ts = Number(r.signatures.performTime)
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

// 按工作者工号查询
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
</style>
