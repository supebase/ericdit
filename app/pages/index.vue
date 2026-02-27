<template>
    <div>
        <ClientOnly>
            <li v-for="post in posts" :key="post.id">
                {{ post.title }}
                <NuxtTime :datetime="post.created" relative />
                <NuxtTime :datetime="post.updated" relative v-if="post.updated" />
                <Markdown :source="post.content" class="prose prose-invert" />
            </li>
            <template #fallback>
                <div>加载中...</div>
            </template>
        </ClientOnly>

        <button @click="refresh()">手动刷新</button>
        <PostEditor />
    </div>
</template>

<script setup>
import Markdown from 'vue3-markdown-it'

const { records: posts, refresh } = useRealtime('posts')
</script>