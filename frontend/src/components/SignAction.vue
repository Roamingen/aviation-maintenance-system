<template>
  <div class="sign-action">
    <div v-if="!walletAddress">
      <el-button type="primary" @click="connectWallet">连接钱包以签名</el-button>
    </div>
    <div v-else>
      <p>当前钱包: {{ walletAddress }}</p>
      
      <!-- Peer Check -->
      <div v-if="canSignPeerCheck" class="action-box">
        <h4>互检签名 (Peer Check)</h4>
        <el-input v-model="inspectorName" placeholder="请输入互检人员姓名" style="margin-bottom: 10px;" />
        <el-input v-model="inspectorId" placeholder="请输入互检人员工号" style="margin-bottom: 10px;" />
        <el-button type="warning" @click="handleSignPeerCheck" :loading="loading">签署互检</el-button>
      </div>

      <!-- RII Check -->
      <div v-if="canSignRII" class="action-box">
        <h4>必检签名 (RII)</h4>
        <el-input v-model="riiName" placeholder="请输入必检人员姓名" style="margin-bottom: 10px;" />
        <el-input v-model="riiId" placeholder="请输入必检人员工号" style="margin-bottom: 10px;" />
        <el-button type="danger" @click="handleSignRII" :loading="loading">签署必检</el-button>
      </div>

      <!-- Release -->
      <div v-if="canSignRelease" class="action-box">
        <h4>放行签名</h4>
        <el-input v-model="releaserName" placeholder="请输入放行人员姓名" style="margin-bottom: 10px;" />
        <el-input v-model="releaserId" placeholder="请输入放行人员工号" style="margin-bottom: 10px;" />
        <el-button type="success" @click="handleSignRelease" :loading="loading">签署放行</el-button>
      </div>
      
      <div v-if="!canSignPeerCheck && !canSignRII && !canSignRelease && recordStatus === 0">
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
  signatures: Object,
  isRII: Boolean
})

const emit = defineEmits(['refresh'])

const walletAddress = ref('')
const inspectorName = ref('')
const inspectorId = ref('')
const riiName = ref('')
const riiId = ref('')
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

const canSignPeerCheck = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  
  // Check if inspectedByPeerCheck is empty
  const peerCheckBy = props.signatures?.inspectedByPeerCheck
  return !peerCheckBy || peerCheckBy === '0x0000000000000000000000000000000000000000'
})

const canSignRII = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  // Only if RII is required
  if (!props.isRII) return false

  // Check if riiBy is empty
  const riiBy = props.signatures?.riiBy
  return !riiBy || riiBy === '0x0000000000000000000000000000000000000000'
})

const canSignRelease = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  
  // If RII is required, it must be signed first
  if (props.isRII) {
      const riiBy = props.signatures?.riiBy
      if (!riiBy || riiBy === '0x0000000000000000000000000000000000000000') {
          return false
      }
  }
  
  return true
})

const getContract = async () => {
    if (!contractConfig.value) await fetchConfig()
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractConfig.value.address, contractConfig.value.abi, signer)
}

const handleSignPeerCheck = async () => {
    if (!inspectorName.value || !inspectorId.value) return ElMessage.warning("请输入姓名和工号")
    loading.value = true
    try {
        const contract = await getContract()
        const tx = await contract.signPeerCheck(props.recordId, inspectorName.value, inspectorId.value, {
            gasLimit: 300000 
        })
        await tx.wait()
        ElMessage.success("互检签名成功")
        emit('refresh')
    } catch (e) {
        console.error(e)
        ElMessage.error("签名失败: " + (e.reason || e.message))
    } finally {
        loading.value = false
    }
}

const handleSignRII = async () => {
    if (!riiName.value || !riiId.value) return ElMessage.warning("请输入姓名和工号")
    loading.value = true
    try {
        const contract = await getContract()
        const tx = await contract.signRII(props.recordId, riiName.value, riiId.value, {
            gasLimit: 300000 
        })
        await tx.wait()
        ElMessage.success("必检签名成功")
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
