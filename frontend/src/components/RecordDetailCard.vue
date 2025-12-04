<template>
  <div class="record-detail-card">
    <el-card>
      <div class="card-header-flex">
        <h4>
          {{ record.workType }} 
          <span style="font-size: 0.8em; color: #909399; font-weight: normal;">#{{ record.recordId.slice(0, 8) }}...</span>
        </h4>
        <el-button v-if="showExpand" type="primary" link @click="$emit('toggle-expand')">
          {{ expanded ? '收起详情' : '查看详情' }}
        </el-button>
      </div>
      
      <!-- 展开的详情区域 (或者如果 alwaysExpanded 为 true 则直接显示) -->
      <div v-if="expanded || alwaysExpanded" class="expanded-detail">
        <el-divider style="margin: 10px 0;" />
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="工卡号" :span="2">
            <el-tooltip :content="record.recordId" placement="top">
                <el-tag type="info" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">{{ record.recordId }}</el-tag>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="Number(record.status) === 1 ? 'success' : 'warning'">
              {{ Number(record.status) === 1 ? '已放行 (Released)' : '待处理 (Pending)' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="飞机号">{{ record.aircraftRegNo }}</el-descriptions-item>
          <el-descriptions-item label="机型">{{ record.aircraftType }}</el-descriptions-item>
          <el-descriptions-item label="版次">{{ record.revision }}</el-descriptions-item>
          <el-descriptions-item label="ATA章节">{{ record.ataCode }}</el-descriptions-item>
          <el-descriptions-item label="工作类型">{{ record.workType }}</el-descriptions-item>
          <el-descriptions-item label="工作地点">{{ record.location }}</el-descriptions-item>
          <el-descriptions-item label="工作日期">{{ formatTimestamp(record.signatures?.performTime) }}</el-descriptions-item>
          <el-descriptions-item label="记录人地址">
            <el-tooltip :content="record.recorder" placement="top">
                <span style="display: inline-block; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom;">{{ record.recorder }}</span>
            </el-tooltip>
          </el-descriptions-item>
          <el-descriptions-item label="上链时间">{{ formatTimestamp(record.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="工作描述" :span="2">{{ record.workDescription }}</el-descriptions-item>
          
          <el-descriptions-item label="消耗件" :span="2">
            <div v-if="record.usedParts && record.usedParts.length">
                <div v-for="(part, idx) in record.usedParts" :key="idx">
                {{ part.partNumber }} (SN: {{ part.serialNumber }})
                </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="工具" :span="2">
            <div v-if="record.usedTools && record.usedTools.length">
                <div v-for="(tool, idx) in record.usedTools" :key="idx">
                {{ tool }}
                </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="测试数据" :span="2">
            <div v-if="record.testMeasureData && record.testMeasureData.length">
                <div v-for="(data, idx) in record.testMeasureData" :key="idx">
                <strong>{{ data.testItemName }}:</strong> {{ data.measuredValues }} 
                <el-tag size="small" :type="data.isPass ? 'success' : 'danger'">{{ data.isPass ? '合格' : '不合格' }}</el-tag>
                </div>
            </div>
            <div v-else>无</div>
          </el-descriptions-item>

          <el-descriptions-item label="更换件" :span="2">
             <div v-if="record.replaceInfo && record.replaceInfo.length">
                <div v-for="(info, idx) in record.replaceInfo" :key="idx" style="margin-bottom: 5px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                <div><el-tag size="small" type="danger">拆</el-tag> {{ info.removedPartNo }} (SN: {{ info.removedSerialNo }}) - 状态: {{ info.removedStatus }}</div>
                <div><el-tag size="small" type="success">装</el-tag> {{ info.installedPartNo }} (SN: {{ info.installedSerialNo }}) - 来源: {{ info.installedSource }}</div>
                <div style="color: #666; font-size: 0.9em;">原因: {{ info.replacementReason }}</div>
                </div>
             </div>
             <div v-else>无</div>
          </el-descriptions-item>
          
          <el-descriptions-item label="工作者" :span="2">
            <div>{{ record.signatures?.performedByName }} (ID: {{ record.signatures?.performedById }})</div>
            <div style="font-size: 0.8em; color: #999;">{{ record.signatures?.performedBy }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="互检人员 (Peer Check)" :span="2">
            <div v-if="record.signatures?.inspectedByPeerCheckName">
                {{ record.signatures?.inspectedByPeerCheckName }} (ID: {{ record.signatures?.inspectedByPeerCheckId }})
                <div style="font-size: 0.8em; color: #999;">{{ record.signatures?.inspectedByPeerCheck }}</div>
            </div>
            <div v-else>
                <el-tag type="info" size="small">未签署</el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="必检人员 (RII)" :span="2">
            <div v-if="record.signatures?.riiByName">
                {{ record.signatures?.riiByName }} (ID: {{ record.signatures?.riiById }})
                <div style="font-size: 0.8em; color: #999;">{{ record.signatures?.riiBy }}</div>
            </div>
            <div v-else>
                <el-tag v-if="record.isRII" type="warning" size="small">待签署 (必检项目)</el-tag>
                <el-tag v-else type="info" size="small">无需签署</el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="放行人员" :span="2">
            <div v-if="record.signatures?.releaseByName">
                {{ record.signatures?.releaseByName }} (ID: {{ record.signatures?.releaseById }})
                <div style="font-size: 0.8em; color: #999;">{{ record.signatures?.releaseBy }}</div>
                <div style="font-size: 0.8em; color: #999;">{{ formatTimestamp(record.signatures?.releaseTime) }}</div>
            </div>
            <div v-else>
                <el-tag type="info" size="small">未签署</el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Sign Action -->
        <SignAction 
            :recordId="record.recordId" 
            :recordStatus="Number(record.status)" 
            :signatures="record.signatures"
            :isRII="record.isRII"
            @refresh="$emit('refresh')"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import SignAction from './SignAction.vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  expanded: {
    type: Boolean,
    default: false
  },
  showExpand: {
    type: Boolean,
    default: true
  },
  alwaysExpanded: {
    type: Boolean,
    default: false
  }
})

const formatTimestamp = (ts) => {
  if (!ts || ts == 0) return ''
  const date = new Date(Number(ts) * 1000)
  return date.toLocaleString()
}
</script>

<style scoped>
.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.expanded-detail {
  margin-top: 10px;
}
</style>
