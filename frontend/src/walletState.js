import { reactive } from 'vue'

export const walletState = reactive({
  address: '',
  isConnected: false
})

export const setWallet = (address) => {
  walletState.address = address
  walletState.isConnected = !!address
}
