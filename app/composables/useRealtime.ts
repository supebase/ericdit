import type { RecordModel } from 'pocketbase'

export const useRealtime = <T = RecordModel>(collectionName: string) => {
    const { $pb } = useNuxtApp()
    const records = shallowRef<T[]>([])

    const { data, error, status, refresh } = useAsyncData(
        `pb-list-${collectionName}`,
        async () => {
            const result = await $pb.collection(collectionName).getList<T>(1, 50, {
                sort: '-created',
            })
            return result.items
        }, {
        server: false
    }
    )

    watch(data, (newVal) => {
        if (newVal) records.value = [...newVal]
    }, { immediate: true })

    const subscribe = () => {
        if (import.meta.server) return

        $pb.collection(collectionName).subscribe<T>('*', ({ action, record }) => {
            switch (action) {
                case 'create':
                    records.value = [record, ...records.value]
                    break
                case 'update':
                    records.value = records.value.map((r: any) =>
                        r.id === (record as any).id ? record : r
                    )
                    break
                case 'delete':
                    records.value = records.value.filter((r: any) =>
                        r.id !== (record as any).id
                    )
                    break
            }
        })
    }

    onMounted(() => {
        subscribe()
    })

    onUnmounted(() => {
        if (import.meta.client) {
            $pb.collection(collectionName).unsubscribe('*')
        }
    })

    return {
        records,
        status,
        refresh,
        error
    }
}