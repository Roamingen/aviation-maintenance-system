<template>
  <div class="sign-action">
    <div v-if="!walletState.isConnected">
      <el-alert title="您当前尚未连接钱包，无法进行签名操作" type="warning" :closable="false" show-icon />
    </div>
    <div v-else>
      <p>当前钱包: {{ walletState.address }}</p>
      
      <!-- 未授权提示 -->
      <div v-if="!isAuthorizedNode">
        <el-alert 
          title="当前账户未获得授权" 
          description="您当前的钱包地址不在授权节点列表中，无法进行任何签名操作。请联系管理员进行授权。"
          type="error" 
          :closable="false" 
          show-icon 
        />
      </div>

      <!-- 只有授权节点才显示签名操作 -->
      <div v-else>
        <!-- Peer Check -->
        <div class="action-box">
            <h4>互检签名 (Peer Check)</h4>
            <div v-if="canSignPeerCheck">
                <el-input v-model="inspectorName" placeholder="请输入互检人员姓名" style="margin-bottom: 10px;" />
                <el-input v-model="inspectorId" placeholder="请输入互检人员工号" style="margin-bottom: 10px;" />
                <el-button type="warning" @click="handleSignPeerCheck" :loading="loadingPeerCheck">签署互检</el-button>
            </div>
            <div v-else>
                <el-alert :title="'无法签署互检: ' + canSignPeerCheckReason" type="info" :closable="false" />
            </div>
        </div>

        <!-- RII Check -->
        <div v-if="canSignRII" class="action-box">
            <h4>必检签名 (RII)</h4>
            <el-input v-model="riiName" placeholder="请输入必检人员姓名" style="margin-bottom: 10px;" />
            <el-input v-model="riiId" placeholder="请输入必检人员工号" style="margin-bottom: 10px;" />
            <el-button type="danger" @click="handleSignRII" :loading="loadingRII">签署必检</el-button>
        </div>

        <!-- Release -->
        <div v-if="canSignRelease" class="action-box">
            <h4>放行签名</h4>
            <el-input v-model="releaserName" placeholder="请输入放行人员姓名" style="margin-bottom: 10px;" />
            <el-input v-model="releaserId" placeholder="请输入放行人员工号" style="margin-bottom: 10px;" />
            <el-button type="success" @click="handleSignRelease" :loading="loadingRelease">签署放行</el-button>
        </div>
        
        <div v-if="!canSignPeerCheck && !canSignRII && !canSignRelease && recordStatus === 0">
            <el-alert title="当前状态无需签名或您无权签名" type="info" :closable="false" />
        </div>
        <div v-if="recordStatus === 1">
            <el-alert title="记录已放行归档" type="success" :closable="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ethers } from 'ethers'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { walletState } from '../walletState'

const props = defineProps({
  recordId: String,
  recordStatus: Number, // 0: Pending, 1: Released
  signatures: Object,
  isRII: Boolean
})

const emit = defineEmits(['refresh'])

// const walletAddress = ref('') // Moved to global state
const inspectorName = ref('')
const inspectorId = ref('')
const riiName = ref('')
const riiId = ref('')
const releaserName = ref('')
const releaserId = ref('')
const loadingPeerCheck = ref(false)
const loadingRII = ref(false)
const loadingRelease = ref(false)
const contractConfig = ref(null)
const isAuthorizedNode = ref(false)

// connectWallet moved to App.vue

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

const getContract = async () => {
    if (!contractConfig.value) await fetchConfig()
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractConfig.value.address, contractConfig.value.abi, signer)
}

const checkAuthorization = async () => {
    if (!walletState.address) {
        isAuthorizedNode.value = false
        return
    }
    try {
        const contract = await getContract()
        const isAuth = await contract.authorizedNodes(walletState.address)
        isAuthorizedNode.value = isAuth
    } catch (e) {
        console.error("Failed to check authorization", e)
        // Don't set to false immediately on error, maybe network issue? 
        // But for safety, default to false is better.
        isAuthorizedNode.value = false
    }
}

watch(() => walletState.address, (newVal) => {
    if (newVal) {
        checkAuthorization()
    } else {
        isAuthorizedNode.value = false
    }
}, { immediate: true })

onMounted(() => {
  fetchConfig()
  // Check if already connected
  // Add a small delay to ensure window.ethereum is injected
  setTimeout(() => {
      if(window.ethereum && window.ethereum.selectedAddress) {
          // walletAddress.value = window.ethereum.selectedAddress // handled by App.vue
          checkAuthorization()
      }
  }, 500)
})

const canSignPeerCheck = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  if (!walletState.address) return false
  if (!isAuthorizedNode.value) return false
  
  const currentAddr = walletState.address.toLowerCase()

  // Check if performer is current user
  if (props.signatures?.performedBy && props.signatures.performedBy.toLowerCase() === currentAddr) {
      return false
  }

  // Check if already signed in peerChecks list
  if (props.signatures?.peerChecks && props.signatures.peerChecks.length > 0) {
      const hasSigned = props.signatures.peerChecks.some(p => p.inspector.toLowerCase() === currentAddr)
      if (hasSigned) return false
  }
  
  // 只要没放行，且当前用户没签过，就可以签
  return true
})

const canSignPeerCheckReason = computed(() => {
  if (props.recordStatus !== 0) return "记录已放行"
  if (!walletState.address) return "未连接钱包"
  if (!isAuthorizedNode.value) return "账户未授权"
  
  const currentAddr = walletState.address.toLowerCase()

  if (props.signatures?.performedBy && props.signatures.performedBy.toLowerCase() === currentAddr) {
      return "工作者不能进行互检"
  }

  if (props.signatures?.peerChecks && props.signatures.peerChecks.length > 0) {
      const hasSigned = props.signatures.peerChecks.some(p => p.inspector.toLowerCase() === currentAddr)
      if (hasSigned) return "您已签署过互检"
  }
  
  return ""
})

const canSignRII = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  if (!isAuthorizedNode.value) return false
  // Only if RII is required
  if (!props.isRII) return false

  // Check if riiBy is empty
  const riiBy = props.signatures?.riiBy
  return !riiBy || riiBy === '0x0000000000000000000000000000000000000000'
})

const canSignRelease = computed(() => {
  // Status must be Pending (0)
  if (props.recordStatus !== 0) return false
  if (!isAuthorizedNode.value) return false
  
  // If RII is required, it must be signed first
  if (props.isRII) {
      const riiBy = props.signatures?.riiBy
      if (!riiBy || riiBy === '0x0000000000000000000000000000000000000000') {
          return false
      }
  }
  
  return true
})

const handleSignPeerCheck = async () => {
    if (!inspectorName.value || !inspectorId.value) return ElMessage.warning("请输入姓名和工号")
    loadingPeerCheck.value = true
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
        loadingPeerCheck.value = false
    }
}

const handleSignRII = async () => {
    if (!riiName.value || !riiId.value) return ElMessage.warning("请输入姓名和工号")
    loadingRII.value = true
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
        loadingRII.value = false
    }
}

const handleSignRelease = async () => {
    if (!releaserName.value || !releaserId.value) return ElMessage.warning("请输入姓名和工号")
    loadingRelease.value = true
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
        loadingRelease.value = false
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
