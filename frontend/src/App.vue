<template>
  <div class="app-container">
    <!-- Login View -->
    <Login v-if="!walletState.isConnected && !walletState.isGuest" />

    <!-- Main App Layout -->
    <el-container v-else class="layout-container">
      <el-aside width="220px" class="aside">
        <div class="logo-area">
          <img :src="planeUrl" class="logo-icon" alt="Logo" />
          <div class="logo-text">民航检修存证</div>
        </div>
        <el-menu
          :default-active="currentView"
          class="el-menu-vertical"
          @select="handleSelect"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="search">
            <el-icon><Search /></el-icon>
            <span>查询信息</span>
          </el-menu-item>
          
          <!-- Only show for Authorized Users -->
          <el-menu-item index="mechanic" v-if="walletState.isAuthorized">
            <el-icon><Edit /></el-icon>
            <span>录入信息</span>
          </el-menu-item>
          
          <!-- Only show for Authorized Users -->
          <el-menu-item index="account" v-if="walletState.isAuthorized">
            <el-icon><Setting /></el-icon>
            <span>账户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-title">基于区块链的民航飞机检修记录存证系统</div>
          <div class="header-right">
            <div v-if="walletState.isGuest" style="display: flex; align-items: center;">
                <el-tag type="info" style="margin-right: 10px;">访客模式 (只读)</el-tag>
                <el-button type="danger" @click="logout">退出登录</el-button>
            </div>
            <div v-else style="display: flex; align-items: center;">
                <el-tag v-if="walletState.isAuthorized" type="success" style="margin-right: 10px;">已授权</el-tag>
                <el-tag v-else type="warning" style="margin-right: 10px;">未授权</el-tag>
                <el-button type="danger" @click="disconnectWallet">
                  注销 ({{ shortAddress }})
                </el-button>
            </div>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <div class="content-wrapper">
            <RecordSearch v-if="currentView === 'search'" />
            <RecordForm v-if="currentView === 'mechanic' && walletState.isAuthorized" />
            <AccountManager v-if="currentView === 'account' && walletState.isAuthorized" />
          </div>
          <div class="footer">
            Blockchain Aviation Maintenance System © 2025
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Search, Edit, List, Setting } from '@element-plus/icons-vue'
import { ethers } from 'ethers'
import { ElMessage } from 'element-plus'
import RecordSearch from './components/RecordSearch.vue'
import RecordForm from './components/RecordForm.vue'
import AccountManager from './components/AccountManager.vue'
import Login from './components/Login.vue'
import { walletState, setWallet, setGuest, setAuthorized } from './walletState'
import logoUrl from './assets/logo.svg'
import planeUrl from './assets/plane.svg'
import axios from 'axios'

const currentView = ref('search')

// Watch for role changes to reset view
watch(() => walletState.isGuest, (newVal) => {
    if (newVal) currentView.value = 'search'
})
watch(() => walletState.isAuthorized, (newVal) => {
    if (!newVal && !walletState.isGuest) currentView.value = 'search'
})

const handleSelect = (key) => {
  currentView.value = key
}

const shortAddress = computed(() => {
  if (!walletState.address) return ''
  return `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
})

// Moved connect logic to Login.vue, but kept disconnect here
const disconnectWallet = () => {
  setWallet('')
  setAuthorized(false)
  ElMessage.info("已断开连接")
}

const logout = () => {
    setGuest(false)
    setWallet('')
    setAuthorized(false)
}

// Auto-check auth on mount if already connected
const checkAuth = async (address) => {
    try {
        const res = await axios.get('http://localhost:3000/api/admin/authorized-nodes')
        if (res.data.success) {
            const nodes = res.data.data
            const isAuth = nodes.some(n => n.address.toLowerCase() === address.toLowerCase())
            setAuthorized(isAuth)
        }
    } catch (e) {
        console.error("Auth check failed", e)
    }
}

onMounted(async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      if (accounts.length > 0) {
        setWallet(accounts[0].address)
        checkAuth(accounts[0].address)
      }
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0])
          checkAuth(accounts[0])
        } else {
          setWallet('')
          setAuthorized(false)
        }
      })
    } catch (e) {
      console.error("Auto connect failed", e)
    }
  }
})
</script>

<style>
body {
  margin: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
  height: 100vh;
}

.app-container {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

.aside {
  background-color: #304156;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background-color: #409EFF; */
  color: #fff;
  font-weight: bold;
  font-size: 18px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.el-menu-vertical {
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.main-content {
  padding: 0;
  background-color: #f0f2f5;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.content-wrapper {
  flex: 1;
  padding: 20px;
}

.footer {
  text-align: center;
  color: #909399;
  font-size: 12px;
  line-height: 60px;
  background-color: transparent;
  flex-shrink: 0;
}

.all-records-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: #fff;
  border-radius: 8px;
}
</style>
