import { reactive } from 'vue'
import { ethers } from 'ethers'

export const walletState = reactive({
  address: '',
  isConnected: false
})

export const setWallet = (address) => {
  // 强制转换为 Checksum 地址 (混合大小写)
  // 如果地址无效，ethers.getAddress 会抛出错误，所以最好加个 try-catch 或者确保传入的是有效地址
  try {
    walletState.address = address ? ethers.getAddress(address) : ''
  } catch (e) {
    console.warn("Invalid address format, using raw value:", address)
    walletState.address = address || ''
  }
  walletState.isConnected = !!address
}
