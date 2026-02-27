<template>
    <div v-if="show" class="modal-overlay" @click.self="close">
        <div class="modal-content">
            <div class="modal-header">
                <h3>登录</h3>
                <button @click="close" class="close-btn">&times;</button>
            </div>

            <div v-if="auth.error.value" class="error-message">
                {{ auth.error.value }}
            </div>

            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label>邮箱</label>
                    <input v-model="email" type="email" required placeholder="admin@example.com" />
                </div>

                <div class="form-group">
                    <label>密码</label>
                    <input v-model="password" type="password" required placeholder="******" />
                </div>

                <button type="submit" class="login-btn" :disabled="auth.loading.value">
                    {{ auth.loading.value ? '登录中...' : '登录' }}
                </button>
            </form>

            <div class="demo-hint">
                <p>💡 演示账号：admin@example.com / 1234567890</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    show: Boolean
})

const emit = defineEmits(['close', 'login-success'])

const auth = useAuth()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
    const success = await auth.login(email.value, password.value)

    if (success) {
        email.value = ''
        password.value = ''
        emit('login-success')
        emit('close')
    }
}

const close = () => {
    emit('close')
    auth.error.value = null
}
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 8px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.modal-header h3 {
    margin: 0;
    font-size: 18px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.close-btn:hover {
    color: #333;
}

.form-group {
    margin-bottom: 16px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
    color: #555;
}

.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.login-btn {
    width: 100%;
    padding: 12px;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 10px;
}

.login-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.error-message {
    background: #ffebee;
    color: #c62828;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
}

.demo-hint {
    margin-top: 20px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 13px;
    color: #666;
    text-align: center;
}
</style>