<template>
  <NuxtLayout>
    <NuxtPage keepalive :key="key" />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { $directus } = useNuxtApp();

const key = ref()

async function subscribe() {
  const { subscription } = await $directus.subscribe('posts', {
    query: { fields: ['*.*'] },
  });

  for await (const item of subscription) {
    if (item.event !== 'init') key.value = new Date().toString()
  }
}

subscribe();
</script>
