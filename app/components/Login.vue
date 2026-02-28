<template>
  <UModal
    v-model:open="modalOpen"
    :title="'登录'"
    :description="'请输入您的账号信息'"
    @close:prevent="handleClosePrevent">
    <template #content>
      <!-- 错误信息 -->
      <div
        v-if="auth.error.value"
        class="px-4 pt-4">
        <UAlert
          :title="auth.error.value"
          color="error"
          variant="soft"
          :close-button="null" />
      </div>

      <!-- 表单内容 -->
      <div class="p-4 space-y-4">
        <form
          @submit.prevent="handleLogin"
          class="space-y-4">
          <UFormField
            label="邮箱"
            required>
            <UInput
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              class="w-full"
              autocomplete="email"
              size="lg" />
          </UFormField>

          <UFormField
            label="密码"
            required>
            <UInput
              v-model="password"
              type="password"
              placeholder="******"
              class="w-full"
              autocomplete="current-password"
              size="lg" />
          </UFormField>

          <UButton
            type="submit"
            color="neutral"
            size="lg"
            block
            :loading="auth.loading.value"
            :disabled="auth.loading.value">
            {{ auth.loading.value ? "登录中..." : "登录" }}
          </UButton>
        </form>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(["close", "login-success"]);

const auth = useAuth();
const email = ref("");
const password = ref("");
const modalOpen = ref(false);

watch(
  () => props.show,
  (newVal) => {
    modalOpen.value = newVal;
  },
  { immediate: true }
);

watch(modalOpen, (newVal) => {
  if (!newVal) {
    emit("close");
    auth.error.value = null;
  }
});

const handleLogin = async () => {
  const success = await auth.login(email.value, password.value);

  if (success) {
    email.value = "";
    password.value = "";
    emit("login-success");
    modalOpen.value = false;
  }
};

const handleClosePrevent = () => {
  console.log("关闭被阻止");
};
</script>
