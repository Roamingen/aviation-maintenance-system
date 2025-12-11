<template>
  <div class="record-form">
    <el-form :model="form" label-width="140px" ref="formRef">
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="飞机注册号" required>
            <el-input v-model="form.aircraftRegNo" placeholder="例如: B-1234" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="机型" required>
            <el-input v-model="form.aircraftType" placeholder="例如: B737-800" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="版次">
            <el-input-number v-model="form.revision" :min="1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="ATA章节号" required>
            <el-input v-model="form.ataCode" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作类型" required>
            <el-select v-model="form.workType" placeholder="请选择工作类型" style="width: 100%">
              <el-option
                v-for="item in workTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="工作地点" required>
        <el-input v-model="form.location" />
      </el-form-item>

      <el-form-item label="工作内容描述" required>
        <el-input v-model="form.workDescription" type="textarea" :rows="3" />
      </el-form-item>

      <el-form-item label="依据文件">
        <el-input v-model="form.referenceDocument" placeholder="AMM, SB, AD..." />
      </el-form-item>

      <el-form-item label="必检项目 (RII)">
        <el-switch v-model="form.isRII" active-text="是" inactive-text="否" />
      </el-form-item>

      <el-divider content-position="left">航材与工具</el-divider>
      
      <!-- 消耗件列表 -->
      <h4>消耗件 (Parts)</h4>
      <el-table :data="form.usedParts" style="width: 100%; margin-bottom: 10px;" border size="small">
        <el-table-column label="件号" prop="partNumber">
          <template #default="scope">
            <el-input v-model="scope.row.partNumber" placeholder="件号" />
          </template>
        </el-table-column>
        <el-table-column label="序号" prop="serialNumber">
          <template #default="scope">
            <el-input v-model="scope.row.serialNumber" placeholder="序号" />
          </template>
        </el-table-column>
        <el-table-column width="60" align="center">
          <template #header>
            <el-button type="primary" link @click="addPart" size="small">+</el-button>
          </template>
          <template #default="scope">
            <el-button type="danger" link @click="removePart(scope.$index)" size="small">-</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 工具列表 -->
      <h4>工具 (Tools)</h4>
      <el-table :data="form.usedTools" style="width: 100%; margin-bottom: 10px;" border size="small">
        <el-table-column label="工具编号">
          <template #default="scope">
            <el-input v-model="scope.row.toolNumber" placeholder="工具编号" />
          </template>
        </el-table-column>
        <el-table-column width="60" align="center">
          <template #header>
            <el-button type="primary" link @click="addTool" size="small">+</el-button>
          </template>
          <template #default="scope">
            <el-button type="danger" link @click="removeTool(scope.$index)" size="small">-</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">测试数据</el-divider>
      <el-table :data="form.testMeasureData" style="width: 100%; margin-bottom: 10px;" border size="small">
        <el-table-column label="实验项目名称" prop="testItemName">
          <template #default="scope">
            <el-input v-model="scope.row.testItemName" placeholder="项目名称" />
          </template>
        </el-table-column>
        <el-table-column label="实测值" prop="measuredValues">
          <template #default="scope">
            <el-input v-model="scope.row.measuredValues" placeholder="禁止填写'正常'" />
          </template>
        </el-table-column>
        <el-table-column label="是否合格" width="100" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.isPass" />
          </template>
        </el-table-column>
        <el-table-column width="60" align="center">
          <template #header>
            <el-button type="primary" link @click="addTestData" size="small">+</el-button>
          </template>
          <template #default="scope">
            <el-button type="danger" link @click="removeTestData(scope.$index)" size="small">-</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">更换件信息 (Replace Info)</el-divider>
      <el-table :data="form.replaceInfo" style="width: 100%; margin-bottom: 10px;" border size="small">
        <el-table-column label="拆下件号">
          <template #default="scope"><el-input v-model="scope.row.removedPartNo" size="small"/></template>
        </el-table-column>
        <el-table-column label="拆下序号">
          <template #default="scope"><el-input v-model="scope.row.removedSerialNo" size="small"/></template>
        </el-table-column>
        <el-table-column label="拆下件状态">
          <template #default="scope"><el-input v-model="scope.row.removedStatus" size="small" placeholder="待修/报废"/></template>
        </el-table-column>
        <el-table-column label="装上件号">
          <template #default="scope"><el-input v-model="scope.row.installedPartNo" size="small"/></template>
        </el-table-column>
        <el-table-column label="装上序号">
          <template #default="scope"><el-input v-model="scope.row.installedSerialNo" size="small"/></template>
        </el-table-column>
        <el-table-column label="装上件来源">
          <template #default="scope"><el-input v-model="scope.row.installedSource" size="small" placeholder="库房/拆件"/></template>
        </el-table-column>
        <el-table-column label="更换原因">
          <template #default="scope"><el-input v-model="scope.row.replacementReason" size="small"/></template>
        </el-table-column>
        <el-table-column width="60" align="center">
          <template #header>
            <el-button type="primary" link @click="addReplaceInfo" size="small">+</el-button>
          </template>
          <template #default="scope">
            <el-button type="danger" link @click="removeReplaceInfo(scope.$index)" size="small">-</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">签署信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="工作者姓名" required>
            <el-input v-model="form.signatures.performedByName" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工作者工号" required>
            <el-input v-model="form.signatures.performedById" placeholder="请输入工号" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="工作日期" required>
        <el-date-picker
          v-model="form.signatures.performTime"
          type="datetime"
          placeholder="选择工作日期和时间"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="loading">提交上链</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'

const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  aircraftRegNo: '',
  aircraftType: '',
  jobCardNo: '',
  revision: 1,
  ataCode: '',
  workType: '',
  location: '',
  workDescription: '',
  referenceDocument: '',
  isRII: false,
  usedParts: [],
  usedTools: [],
  testMeasureData: [],
  faultInfo: {
    fimCode: '',
    faultDescription: ''
  },
  signatures: {
    performedByName: '',
    performedById: '',
    performTime: 0,
    inspectedBy: '',
    inspectedByName: '',
    inspectedById: '',
    riiBy: '',
    riiByName: '',
    riiById: '',
    releaseBy: '',
    releaseByName: '',
    releaseById: '',
    releaseTime: 0
  },
  replaceInfo: []
})

// Helper functions for dynamic tables
const addPart = () => form.usedParts.push({ partNumber: '', serialNumber: '' })
const removePart = (index) => form.usedParts.splice(index, 1)

const addTool = () => form.usedTools.push({ toolNumber: '' })
const removeTool = (index) => form.usedTools.splice(index, 1)

const addTestData = () => form.testMeasureData.push({ testItemName: '', measuredValues: '', isPass: true })
const removeTestData = (index) => form.testMeasureData.splice(index, 1)

const addReplaceInfo = () => form.replaceInfo.push({
  removedPartNo: '', removedSerialNo: '', removedStatus: '',
  installedPartNo: '', installedSerialNo: '', installedSource: '', replacementReason: ''
})
const removeReplaceInfo = (index) => form.replaceInfo.splice(index, 1)

const workTypeOptions = [
  { value: 'Pre-flight Inspection', label: '航前检查（Pre-flight Inspection）' },
  { value: 'Transit / Turnaround Check', label: '过站检查（Transit / Turnaround Check）' },
  { value: 'Post-flight Inspection', label: '航后检查（Post-flight Inspection）' },
  { value: 'Daily Check', label: '每日检查（Daily Check）' },
  { value: 'A-Check', label: 'A 检（A-Check）' },
  { value: 'B-Check', label: 'B 检（B-Check）' },
  { value: 'C-Check', label: 'C 检（C-Check）' },
  { value: 'D-Check / Heavy Maintenance Visit', label: 'D 检 / 重检（D-Check / Heavy Maintenance Visit）' },
  { value: 'Life-limited Parts Replacement', label: '时控件更换（Life-limited Parts Replacement）' }
]

const submitForm = async () => {
  if (!form.aircraftRegNo || !form.workDescription || !form.signatures.performedByName || !form.signatures.performedById || !form.ataCode || !form.workType || !form.location || !form.signatures.performTime) {
    ElMessage.error('请填写必填项 (注册号、ATA章节号、工作类型、工作地点、工作描述、工作者姓名、工号、工作日期)')
    return
  }

  loading.value = true
  try {
    // 转换时间为秒级时间戳
    const performTimeSeconds = Math.floor(new Date(form.signatures.performTime).getTime() / 1000)

    // Prepare data for backend
    const payload = {
      ...form,
      signatures: {
        ...form.signatures,
        performTime: performTimeSeconds
      },
      usedTools: form.usedTools.map(t => t.toolNumber) // Transform objects to strings
    }

    const response = await axios.post('http://localhost:3000/api/record', payload)
    if (response.data.success) {
      ElNotification({
        title: '提交成功',
        message: `工作单号(Hash): ${response.data.jobCardNo}`,
        type: 'success',
        duration: 0, // 不自动关闭
        width: '500px'
      })
      resetForm()
    } else {
      ElMessage.error('提交失败: ' + response.data.error)
    }
  } catch (error) {
    ElMessage.error('请求错误: ' + error.message)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.workDescription = ''
  form.usedParts = []
  form.usedTools = []
  form.testMeasureData = []
  form.replaceInfo = []
}
</script>

<style scoped>
.record-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
