<template>
  <div class="login-container">
    <el-card class="login-card">
      <div class="login-content">
        <div class="logo-area">
          <img :src="logoUrl" class="logo-icon" alt="Logo" />
          <h2 class="title">民航检修存证系统</h2>
        </div>
        
        <div class="action-area">
          <el-button type="primary" size="large" class="login-btn" @click="handleWalletLogin" :loading="loading">
            授权用户登录 (Connect Wallet)
          </el-button>
          
          <el-divider>或者</el-divider>
          
          <el-button size="large" class="login-btn" @click="handleGuestLogin">
            访客登录 (Guest Access)
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ethers } from 'ethers'
import { ElMessage } from 'element-plus'
import { setWallet, setGuest, setAuthorized } from '../walletState'
import logoUrl from '../assets/logo.svg'
import axios from 'axios'

const loading = ref(false)
const API_BASE_URL = 'http://localhost:3000'

const handleGuestLogin = () => {
  setGuest(true)
  ElMessage.info("已进入访客模式 (仅查看)")
}

const handleWalletLogin = async () => {
  if (typeof window.ethereum === 'undefined') {
    ElMessage.error("未检测到 MetaMask，请先安装钱包插件")
    return
  }

  loading.value = true
  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await provider.send("eth_requestAccounts", [])
    const address = accounts[0]
    
    setWallet(address)
    
    // Check authorization
    try {
        // We can check via backend API which queries the contract
        const res = await axios.get(`${API_BASE_URL}/api/admin/authorized-nodes`)
        if (res.data.success) {
            const nodes = res.data.data
            // Check if current address is in the list (case insensitive)
            const isAuth = nodes.some(n => n.address.toLowerCase() === address.toLowerCase())
            setAuthorized(isAuth)
            
            if (isAuth) {
                ElMessage.success("授权用户登录成功")
            } else {
                ElMessage.warning("钱包已连接，但未授权 (仅查看权限)")
            }
        }
    } catch (e) {
        console.error("Auth check failed", e)
        // Fallback: assume not authorized or let individual components handle it
        setAuthorized(false) 
    }

  } catch (error) {
    console.error("Login error:", error)
    ElMessage.error("登录失败: " + error.message)
    setWallet('') // Reset
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.login-card {
  width: 480px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 40px;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60px;
}

.logo-icon {
  width: 100px;
  height: 100px;
  margin-bottom: 20px;
}

.title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.action-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  padding: 22px 0;
}
</style>
