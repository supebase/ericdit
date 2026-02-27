export const useAuth = () => {
    const { $pb } = useNuxtApp()

    // 直接使用 ref 包裹当前状态
    const user = ref($pb.authStore.record)
    const isAuthenticated = ref($pb.authStore.isValid)
    const loading = ref(false)
    const error = ref(null)

    // 监听认证状态变化
    const unsubscribe = $pb.authStore.onChange((token, record) => {
        user.value = record
        isAuthenticated.value = !!token
    })

    // 组件卸载时取消监听
    onUnmounted(() => {
        unsubscribe()
    })

    // 登录
    const login = async (email: string, password: string) => {
        loading.value = true
        error.value = null

        try {
            await $pb.collection('users').authWithPassword(email, password)
            return true
        } catch (err: any) {
            error.value = err.message || '登录失败'
            return false
        } finally {
            loading.value = false
        }
    }

    // 登出
    const logout = () => {
        $pb.authStore.clear()
    }

    return {
        user,
        isAuthenticated,
        loading,
        error,
        login,
        logout
    }
}