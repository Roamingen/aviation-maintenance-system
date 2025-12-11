<template>
  <div class="account-manager">
    <el-row :gutter="20">
      <!-- 授权钱包 -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>授权钱包 (Authorize Wallet)</span>
            </div>
          </template>
          <div class="card-content">
            <p class="description">
              允许指定钱包地址参与签名和记录上链。需要管理员权限。
            </p>
            <el-form :model="authForm" label-width="100px">
              <el-form-item label="钱包地址" required>
                <el-input v-model="authForm.address" placeholder="0x..." />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="authorizeWallet" :loading="authLoading">授权</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 发送 ETH -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>发送测试币 (Fund Wallet)</span>
            </div>
          </template>
          <div class="card-content">
            <p class="description">
              从测试网水龙头 (Account #0) 发送 ETH 到指定钱包。仅限测试环境。
            </p>
            <el-form :model="fundForm" label-width="100px">
              <el-form-item label="接收地址" required>
                <el-input v-model="fundForm.address" placeholder="0x..." />
              </el-form-item>
              <el-form-item label="金额 (ETH)">
                <el-input v-model="fundForm.amount" placeholder="1.0" />
              </el-form-item>
              <el-form-item>
                <el-button type="success" @click="fundWallet" :loading="fundLoading">发送 ETH</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 已授权节点列表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>已授权节点列表 (Authorized Nodes)</span>
              <el-button type="primary" link @click="fetchAuthorizedNodes">刷新</el-button>
            </div>
          </template>
          <el-table :data="authorizedNodes" style="width: 100%" v-loading="listLoading" empty-text="暂无授权节点">
            <el-table-column prop="address" label="钱包地址" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-popconfirm title="确定要取消该节点的授权吗？" @confirm="revokeAuthorization(scope.row.address)">
                  <template #reference>
                    <el-button 
                      type="danger" 
                      size="small" 
                      :loading="scope.row.loading"
                    >
                      取消授权
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 提示信息 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-alert
          title="注意：此功能直接调用后端管理员账户执行操作，仅供开发测试使用。"
          type="warning"
          show-icon
          :closable="false"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_BASE_URL = 'http://localhost:3000'

// 列表相关
const authorizedNodes = ref([])
const listLoading = ref(false)

const fetchAuthorizedNodes = async () => {
  listLoading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/api/admin/authorized-nodes`)
    if (res.data.success) {
      authorizedNodes.value = res.data.data.map(addr => ({
        address: addr,
        loading: false
      }))
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取授权列表失败')
  } finally {
    listLoading.value = false
  }
}

const revokeAuthorization = async (address) => {
  const node = authorizedNodes.value.find(n => n.address === address)
  if (node) node.loading = true
  
  try {
    const res = await axios.post(`${API_BASE_URL}/api/admin/revoke`, { address })
    if (res.data.success) {
      ElMessage.success('取消授权成功')
      fetchAuthorizedNodes()
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('取消授权失败: ' + (error.response?.data?.error || error.message))
    if (node) node.loading = false
  }
}

// 授权表单
const authForm = ref({
  address: ''
})
const authLoading = ref(false)

const authorizeWallet = async () => {
  if (!authForm.value.address) {
    ElMessage.warning('请输入钱包地址')
    return
  }
  
  authLoading.value = true
  try {
    const res = await axios.post(`${API_BASE_URL}/api/admin/authorize`, {
      address: authForm.value.address
    })
    
    if (res.data.success) {
      ElMessage.success(`授权成功! 交易哈希: ${res.data.txHash}`)
      authForm.value.address = ''
      fetchAuthorizedNodes() // 刷新列表
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('授权失败: ' + (error.response?.data?.error || error.message))
  } finally {
    authLoading.value = false
  }
}

onMounted(() => {
  fetchAuthorizedNodes()
})

// 资金表单
const fundForm = ref({
  address: '',
  amount: '1.0'
})
const fundLoading = ref(false)

const fundWallet = async () => {
  if (!fundForm.value.address) {
    ElMessage.warning('请输入接收地址')
    return
  }
  
  fundLoading.value = true
  try {
    const res = await axios.post(`${API_BASE_URL}/api/admin/fund`, {
      address: fundForm.value.address,
      amount: fundForm.value.amount
    })
    
    if (res.data.success) {
      ElMessage.success(`发送成功! 交易哈希: ${res.data.txHash}`)
      fundForm.value.address = ''
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('发送失败: ' + (error.response?.data?.error || error.message))
  } finally {
    fundLoading.value = false
  }
}
</script>

<style scoped>
.account-manager {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}
</style>
