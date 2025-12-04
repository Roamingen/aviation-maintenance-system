<template>
  <div class="sign-action">
    <div v-if="!walletAddress">
      <el-button type="primary" @click="connectWallet">连接钱包以签名</el-button>
    </div>
    <div v-else>
      <p>当前钱包: {{ walletAddress }}</p>
      
      <!-- Inspection -->
      <div v-if="canSignInspect" class="action-box">
        <h4>检验签名</h4>
        <el-input v-model="inspectorName" placeholder="请输入检验员姓名" style="margin-bottom: 10px;" />
        <el-input v-model="inspectorId" placeholder="请输入检验员工号" style="margin-bottom: 10px;" />
        <el-button type="warning" @click="handleSignInspect" :loading="loading">签署检验</el-button>
      </div>

      <!-- Release -->
      <div v-if="canSignRelease" class="action-box">
        <h4>放行签名</h4>
        <el-input v-model="releaserName" placeholder="请输入放行人员姓名" style="margin-bottom: 10px;" />
        <el-input v-model="releaserId" placeholder="请输入放行人员工号" style="margin-bottom: 10px;" />
        <el-button type="success" @click="handleSignRelease" :loading="loading">签署放行</el-button>
      </div>
      
      <div v-if="!canSignInspect && !canSignRelease && recordStatus === 0">
        <el-alert title="当前状态无需签名或您无权签名" type="info" :closable="false" />
      </div>
       <div v-if="recordStatus === 1">
        <el-alert title="记录已放行归档" type="success" :closable="false" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ethers } from 'ethers'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  recordId: String,
  recordStatus: Number, // 0: Pending, 1: Released
  signatures: Object
})

const emit = defineEmits(['refresh'])

const walletAddress = ref('')
const inspectorName = ref('')
const inspectorId = ref('')
const releaserName = ref('')
const releaserId = ref('')
const loading = ref(false)
const contractConfig = ref(null)

const connectWallet = async () => {
  console.log("Attempting to connect wallet...");
  console.log("window.ethereum:", window.ethereum);
  
  if (typeof window.ethereum !== 'undefined') {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      walletAddress.value = accounts[0]
      ElMessage.success("钱包连接成功")
    } catch (error) {
      console.error("Wallet connection error:", error);
      ElMessage.error("连接钱包失败: " + (error.message || "未知错误"))
    }
  } else {
    console.error("MetaMask not found in window object");
    ElMessage.warning("未检测到 MetaMask。请确保插件已启用，并尝试刷新页面。")
  }
}

const fetchConfig = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/config')
    if (res.data.success) {
      contractConfig.value = res.data
    }
  } catch (e) {
    console.error("Failed to fetch config", e)
  }
}

onMounted(() => {
  fetchConfig()
  // Check if already connected
  // Add a small delay to ensure window.ethereum is injected
  setTimeout(() => {
      if(window.ethereum && window.ethereum.selectedAddress) {
          walletAddress.value = window.ethereum.selectedAddress
      }
  }, 500)
})

const canSignInspect = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  
  // Check if inspectedBy is empty (0x000...)
  const inspectedBy = props.signatures?.inspectedBy
  // If inspectedBy is 0x0...0, then it needs inspection (or is available for inspection)
  // Note: In this simplified logic, we allow anyone to sign as inspector if it's not signed yet.
  return !inspectedBy || inspectedBy === '0x0000000000000000000000000000000000000000'
})

const canSignRelease = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  
  // Can release if inspection is done OR if we don't enforce inspection strictly in UI (contract enforces logic)
  // But usually release comes after inspection.
  // Let's allow release if inspection is signed OR if we want to allow skipping (contract allows skipping if logic permits)
  // Contract: require(r.status == RecordStatus.Pending)
  return true
})

const getContract = async () => {
    if (!contractConfig.value) await fetchConfig()
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractConfig.value.address, contractConfig.value.abi, signer)
}

const handleSignInspect = async () => {
    if (!inspectorName.value || !inspectorId.value) return ElMessage.warning("请输入姓名和工号")
    loading.value = true
    try {
        const contract = await getContract()
        // 显式指定 gasLimit，防止 MetaMask 估算失败导致无法点击确认
        // 同时也避免 "Request blocked due to spam filter" 这种误报
        const tx = await contract.signInspection(props.recordId, inspectorName.value, inspectorId.value, {
            gasLimit: 300000 
        })
        await tx.wait()
        ElMessage.success("检验签名成功")
        emit('refresh')
    } catch (e) {
        console.error(e)
        ElMessage.error("签名失败: " + (e.reason || e.message))
    } finally {
        loading.value = false
    }
}

const handleSignRelease = async () => {
    if (!releaserName.value || !releaserId.value) return ElMessage.warning("请输入姓名和工号")
    loading.value = true
    try {
        const contract = await getContract()
        // 显式指定 gasLimit
        const tx = await contract.signRelease(props.recordId, releaserName.value, releaserId.value, {
            gasLimit: 300000
        })
        await tx.wait()
        ElMessage.success("放行签名成功")
        emit('refresh')
    } catch (e) {
        console.error(e)
        ElMessage.error("签名失败: " + (e.reason || e.message))
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.sign-action {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.action-box {
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
