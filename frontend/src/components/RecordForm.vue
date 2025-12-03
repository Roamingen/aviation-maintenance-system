<template>
  <div class="record-form">
    <el-form :model="form" label-width="140px" ref="formRef">
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="飞机注册号" required>
            <el-input v-model="form.aircraftRegNo" placeholder="例如: B-1234" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="机型" required>
            <el-input v-model="form.aircraftType" placeholder="例如: B737-800" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工卡号" required>
            <el-input v-model="form.jobCardNo" placeholder="唯一标识" />
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
          <el-form-item label="ATA章节号">
            <el-input v-model="form.ataCode" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作类型">
            <el-select v-model="form.workType" placeholder="请选择">
              <el-option label="航前检查" value="Pre-flight" />
              <el-option label="航后检查" value="Post-flight" />
              <el-option label="排故" value="Troubleshooting" />
              <el-option label="定检" value="Scheduled Check" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="工作地点">
        <el-input v-model="form.location" />
      </el-form-item>

      <el-form-item label="工作内容描述" required>
        <el-input v-model="form.workDescription" type="textarea" :rows="3" />
      </el-form-item>

      <el-form-item label="依据文件">
        <el-input v-model="form.referenceDocument" placeholder="AMM, SB, AD..." />
      </el-form-item>

      <el-divider content-position="left">航材与工具</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="件号">
            <el-input v-model="form.partToolList.partNumber" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="序号">
            <el-input v-model="form.partToolList.serialNumber" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工具编号">
            <el-input v-model="form.partToolList.toolNumber" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">测试数据</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="实测值">
            <el-input v-model="form.testMeasureData.measuredValues" placeholder="禁止填写'正常'" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否合格">
            <el-switch v-model="form.testMeasureData.isPass" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">签署信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="工作者签名" required>
            <el-input v-model="form.signatures.performedBy" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="放行人员">
            <el-input v-model="form.signatures.releaseBy" />
          </el-form-item>
        </el-col>
      </el-row>

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
  partToolList: {
    partNumber: '',
    serialNumber: '',
    toolNumber: ''
  },
  testMeasureData: {
    measuredValues: '',
    isPass: true
  },
  faultInfo: {
    fimCode: '',
    faultDescription: ''
  },
  signatures: {
    performedBy: '',
    performTime: 0,
    inspectedBy: '',
    riiBy: '',
    releaseBy: ''
  },
  replaceInfo: {
    removedPartNo: '',
    removedSerialNo: '',
    removedStatus: '',
    installedPartNo: '',
    installedSerialNo: '',
    installedSource: '',
    replacementReason: ''
  }
})

const submitForm = async () => {
  if (!form.aircraftRegNo || !form.jobCardNo || !form.workDescription) {
    ElMessage.error('请填写必填项')
    return
  }

  loading.value = true
  try {
    // 设置当前时间戳
    form.signatures.performTime = Math.floor(Date.now() / 1000)

    const response = await axios.post('http://localhost:3000/api/record', form)
    if (response.data.success) {
      ElNotification({
        title: '提交成功',
        message: `交易哈希: ${response.data.txHash}`,
        type: 'success',
        duration: 0, // 不自动关闭
        width: '500px' // 尝试设置宽度，虽然 Element Plus Notification 宽度通常由 CSS 控制，但内容长会自动撑开
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
  // 简单重置逻辑，实际可能需要更深度的重置
  form.jobCardNo = ''
  form.workDescription = ''
  form.testMeasureData.measuredValues = ''
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
