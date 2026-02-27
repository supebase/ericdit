import PocketBase from 'pocketbase'

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig()

    // 只在客户端创建实例
    const pb = new PocketBase(config.public.apiBase)
    pb.autoCancellation(false)

    return {
        provide: {
            pb
        }
    }
})

declare module '#app' {
    interface NuxtApp {
        $pb: PocketBase
    }
}