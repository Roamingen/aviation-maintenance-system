<template>
  <div class="app-container">
    <el-container class="layout-container">
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
          <el-menu-item index="mechanic">
            <el-icon><Edit /></el-icon>
            <span>录入信息</span>
          </el-menu-item>
          <el-menu-item index="account">
            <el-icon><Setting /></el-icon>
            <span>账户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="header-title">基于区块链的民航飞机检修记录存证系统</div>
          <div class="header-right">
            <el-button 
              v-if="!walletState.isConnected" 
              type="primary" 
              @click="connectWallet"
            >
              连接钱包
            </el-button>
            <el-button 
              v-else 
              type="danger" 
              @click="disconnectWallet"
            >
              注销 ({{ shortAddress }})
            </el-button>
          </div>
        </el-header>
        
        <el-main class="main-content">
          <div class="content-wrapper">
            <RecordSearch v-if="currentView === 'search'" />
            <RecordForm v-if="currentView === 'mechanic'" />
            <AccountManager v-if="currentView === 'account'" />
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
import { ref, onMounted, computed } from 'vue'
import { Search, Edit, List, Setting } from '@element-plus/icons-vue'
import { ethers } from 'ethers'
import { ElMessage } from 'element-plus'
import RecordSearch from './components/RecordSearch.vue'
import RecordForm from './components/RecordForm.vue'
import AccountManager from './components/AccountManager.vue'
import { walletState, setWallet } from './walletState'
import logoUrl from './assets/logo.svg'
import planeUrl from './assets/plane.svg'

const currentView = ref('search')

const handleSelect = (key) => {
  currentView.value = key
}

const shortAddress = computed(() => {
  if (!walletState.address) return ''
  return `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`
})

const connectWallet = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])
      setWallet(accounts[0])
      ElMessage.success("钱包连接成功")
    } catch (error) {
      console.error("Wallet connection error:", error);
      ElMessage.error("连接钱包失败: " + (error.message || "未知错误"))
    }
  } else {
    ElMessage.warning("未检测到 MetaMask。请确保插件已启用。")
  }
}

const disconnectWallet = () => {
  setWallet('')
  ElMessage.info("已断开连接")
}

onMounted(async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      if (accounts.length > 0) {
        setWallet(accounts[0].address)
      }
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0])
        } else {
          setWallet('')
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
  background-color: #2b3649;
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
