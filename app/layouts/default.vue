<template>
    <div>
        <header class="site-header">
            <div class="header-container">
                <CommonLogo :width="32" :height="32" />

                <nav class="nav-menu">
                    <NuxtLink to="/">首页</NuxtLink>

                    <!-- 直接使用 isAuthenticated 判断 -->
                    <ClientOnly>
                        <div class="auth-section">
                            <template v-if="auth.isAuthenticated.value">
                                <span class="user-greeting">
                                    👤 {{ auth.user.value?.email }}
                                </span>
                                <button @click="handleLogout" class="logout-btn">
                                    退出
                                </button>
                            </template>
                            <button v-else @click="showLoginModal = true" class="login-btn">
                                登录
                            </button>
                        </div>
                        <template #fallback>
                            <div>加载中...</div>
                        </template>
                    </ClientOnly>
                </nav>
            </div>
        </header>

        <main class="main-content">
            <slot />
        </main>

        <Login :show="showLoginModal" @close="showLoginModal = false"
            @login-success="showLoginModal = false" />
    </div>
</template>

<script setup>
const auth = useAuth()
const showLoginModal = ref(false)

const handleLogout = () => {
    auth.logout()
}
</script>

<style scoped>
.site-header {
    border-bottom: 1px solid #eee;
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo a {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    text-decoration: none;
}

.nav-menu {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.nav-menu a {
    color: #666;
    text-decoration: none;
    font-size: 1rem;
}

.nav-menu a:hover {
    color: #007aff;
}

.auth-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 1px solid #eee;
}

.user-greeting {
    font-size: 0.9rem;
    color: #666;
}

.login-btn,
.logout-btn {
    padding: 6px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.login-btn {
    background: #007aff;
    color: white;
}

.logout-btn {
    background: #ff3b30;
    color: white;
}

.main-content {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 20px;
}

.loading-auth {
    color: #999;
    font-size: 14px;
}
</style>