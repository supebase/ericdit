<template>
    <div class="post-editor">
        <!-- 文章标题 -->
        <input v-model="post.title" placeholder="文章标题" class="title-input" />

        <div class="editor-layout">
            <!-- 左侧：图片管理区 -->
            <div class="image-manager">
                <div class="image-toolbar">
                    <h3>图片库 ({{ totalImagesCount }}/20)</h3>
                    <button @click="triggerUpload" class="upload-btn"
                        :disabled="totalImagesCount >= 20">
                        上传图片
                    </button>
                </div>

                <!-- 上传进度条 - 按批次显示 -->
                <div v-if="uploadingBatches.length > 0" class="upload-progress">
                    <div v-for="batch in uploadingBatches" :key="batch.batchId"
                        class="batch-progress">
                        <div class="batch-header">
                            <span>批量上传 {{ batch.files.length }} 张图片</span>
                            <span>{{ batch.progress }}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: batch.progress + '%' }">
                            </div>
                        </div>
                        <div class="batch-files">
                            <div v-for="file in batch.files" :key="file.id" class="batch-file">
                                <span>{{ file.name }}</span>
                                <span>{{ file.progress }}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 图片网格 - 按批次分组 -->
                <div class="image-grid" ref="imageGridRef">
                    <!-- 按批次分组显示 -->
                    <div v-for="batch in imageBatches" :key="batch.batchId" class="image-batch">
                        <div class="batch-label">
                            批次 {{ formatBatchTime(batch.created) }} ({{ batch.images.length }}张)
                            <button @click="deleteBatch(batch)" class="delete-batch-btn"
                                title="删除整批">🗑️</button>
                        </div>
                        <div class="batch-images">
                            <div v-for="img in batch.images" :key="img.id" class="image-item"
                                :class="{ 'dragging': img.isDragging }" draggable="true"
                                @dragstart="handleDragStart($event, img)"
                                @dragend="handleDragEnd(img)">
                                <!-- 图片预览 -->
                                <div class="image-preview">
                                    <img :src="img.previewUrl || img.serverUrl" :alt="img.name" />

                                    <!-- 图片操作菜单（只保留编辑Alt，删除移到批次级别） -->
                                    <div class="image-actions">
                                        <button @click="editAlt(img)" title="编辑Alt文本">
                                            编辑
                                        </button>
                                    </div>

                                    <!-- Alt文本显示 -->
                                    <div v-if="img.alt" class="image-alt">{{ img.alt }}</div>
                                </div>

                                <!-- 点击插入按钮 -->
                                <button class="insert-btn" @click="insertAtCursor(img)"
                                    title="点击插入到编辑器">
                                    插入图片
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 右侧：Markdown编辑器 -->
            <div class="editor-area">
                <textarea ref="editorRef" v-model="post.content" class="markdown-editor"
                    placeholder="在这里写文章... 支持Markdown语法" @drop="handleDrop"
                    @dragover.prevent></textarea>

                <!-- 预览切换 -->
                <div class="editor-footer">
                    <button @click="previewMode = !previewMode">
                        {{ previewMode ? '编辑' : '预览' }}
                    </button>
                </div>

                <!-- Markdown预览 -->
                <div v-if="previewMode" class="markdown-preview">
                    <Markdown :source="post.content" />
                </div>
            </div>
        </div>

        <!-- 底部发布栏 -->
        <div class="publish-bar">
            <div class="publish-info">
                <span v-if="uploadingBatches.length > 0">
                    正在上传 {{ uploadingBatches.length }} 个批次...
                </span>
                <span v-else>
                    共 {{ totalImagesCount }} 张图片，{{ wordCount }} 字
                </span>
            </div>
            <button @click="publishPost" class="publish-btn"
                :disabled="isPublishing || uploadingBatches.length > 0 || !auth.isAuthenticated">
                <span v-if="isPublishing">发布中...</span>
                <span v-else-if="!auth.isAuthenticated">请先登录</span>
                <span v-else>发布文章</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import Markdown from 'vue3-markdown-it'

const { $pb } = useNuxtApp()
const auth = useAuth()

// 文章数据
const post = reactive({
    title: '',
    content: ''
})

// 图片管理 - 按批次存储
const imageBatches = ref([])           // 已上传的图片批次
const uploadingBatches = ref([])       // 上传中的批次
const previewMode = ref(false)          // 预览模式
const isPublishing = ref(false)         // 发布状态

// 编辑器引用
const editorRef = ref(null)
const imageGridRef = ref(null)

// 总图片数量
const totalImagesCount = computed(() => {
    return imageBatches.value.reduce((total, batch) => total + batch.images.length, 0)
})

// 字数统计
const wordCount = computed(() => {
    return post.content.trim().length
})

// 格式化批次时间
const formatBatchTime = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}

// 触发文件选择
const triggerUpload = () => {
    const maxAllowed = 20 - totalImagesCount.value
    if (maxAllowed <= 0) {
        alert('已达到20张图片上限')
        return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = 'image/jpeg,image/png,image/gif,image/webp'
    input.onchange = (e) => handleImageSelect(e.target.files, maxAllowed)
    input.click()
}

// 处理图片选择
const handleImageSelect = async (files, maxAllowed) => {
    // 检查数量限制
    if (files.length > maxAllowed) {
        alert(`最多还能上传 ${maxAllowed} 张图片`)
        return
    }

    const batchId = 'batch_' + Date.now()
    const batchFiles = []

    for (const file of files) {
        // 生成本地预览
        const previewUrl = URL.createObjectURL(file)
        const tempId = batchId + '_' + file.name

        batchFiles.push({
            id: tempId,
            file: file,
            name: file.name,
            previewUrl: previewUrl,
            progress: 0,
            alt: file.name.split('.')[0],
            serverData: null
        })
    }

    // 添加上传批次
    uploadingBatches.value.push({
        batchId: batchId,
        files: batchFiles,
        progress: 0,
        created: Date.now()
    })

    // 开始上传批次
    await uploadBatch(batchId, batchFiles)
}

// 上传整个批次
const uploadBatch = async (batchId, files) => {
    const batch = uploadingBatches.value.find(b => b.batchId === batchId)
    if (!batch) return

    try {
        const formData = new FormData()

        // multiple 字段需要把所有文件都 append 到 'images'
        files.forEach(item => {
            formData.append('images', item.file)
        })

        // 模拟进度
        const progressInterval = setInterval(() => {
            if (batch.progress < 90) {
                batch.progress += 10
                // 同时更新每个文件的进度
                files.forEach(item => {
                    item.progress = batch.progress
                })
            } else {
                clearInterval(progressInterval)
            }
        }, 200)

        // 实际上传 - 一次性创建记录
        const record = await $pb.collection('files').create(formData)

        clearInterval(progressInterval)
        batch.progress = 100
        files.forEach(item => item.progress = 100)

        // 获取服务器URL（record.images 是一个数组）
        const serverUrls = record.images.map(file =>
            $pb.files.getURL(record, file)
        )

        // 从上传队列移到已上传队列
        setTimeout(() => {
            // 从上传批次中移除
            const batchIndex = uploadingBatches.value.findIndex(b => b.batchId === batchId)
            if (batchIndex !== -1) {
                uploadingBatches.value.splice(batchIndex, 1)
            }

            // 创建已上传批次
            const uploadedBatch = {
                batchId: record.id,
                created: Date.now(),
                recordId: record.id,
                images: files.map((item, index) => ({
                    id: record.id + '_' + index,
                    recordId: record.id,
                    fileIndex: index,
                    name: item.name,
                    previewUrl: item.previewUrl,
                    serverUrl: serverUrls[index],
                    alt: item.alt,
                    isDragging: false
                }))
            }

            imageBatches.value.push(uploadedBatch)
        }, 500)

    } catch (error) {
        console.error('上传失败:', error)
        // 移除失败的批次
        const index = uploadingBatches.value.findIndex(b => b.batchId === batchId)
        if (index !== -1) {
            // 释放预览URL
            files.forEach(item => URL.revokeObjectURL(item.previewUrl))
            uploadingBatches.value.splice(index, 1)
        }
        alert(`图片上传失败: ${error.message}`)
    }
}

// 删除整个批次
const deleteBatch = async (batch) => {
    if (!confirm(`确定要删除这组 ${batch.images.length} 张图片吗？`)) return

    try {
        // 删除服务器记录
        await $pb.collection('files').delete(batch.recordId)

        // 从列表中移除
        const index = imageBatches.value.findIndex(b => b.batchId === batch.batchId)
        if (index !== -1) {
            // 释放预览URL
            batch.images.forEach(img => {
                if (img.previewUrl) URL.revokeObjectURL(img.previewUrl)
            })
            imageBatches.value.splice(index, 1)
        }

        // 从内容中移除所有图片引用
        batch.images.forEach(img => {
            if (img.serverUrl) {
                const imageMarkdown = `![](${img.serverUrl})`
                post.content = post.content.replace(imageMarkdown, '')
            }
        })

    } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败：' + error.message)
    }
}

// 编辑Alt文本
const editAlt = (image) => {
    const newAlt = prompt('输入图片Alt文本:', image.alt)
    if (newAlt !== null) {
        image.alt = newAlt
    }
}

// 拖拽开始
const handleDragStart = (event, image) => {
    image.isDragging = true
    event.dataTransfer.setData('text/plain', JSON.stringify({
        type: 'image',
        url: image.serverUrl,
        alt: image.alt,
        id: image.id
    }))
    event.dataTransfer.effectAllowed = 'copy'
}

// 拖拽结束
const handleDragEnd = (image) => {
    image.isDragging = false
}

// 处理拖拽放下
const handleDrop = (event) => {
    event.preventDefault()

    const data = event.dataTransfer.getData('text/plain')
    if (!data) return

    try {
        const imageData = JSON.parse(data)
        if (imageData.type === 'image') {
            insertAtCursor({
                serverUrl: imageData.url,
                alt: imageData.alt
            })
        }
    } catch (e) {
        // 如果不是JSON，可能是直接拖拽的文件
        if (event.dataTransfer.files.length > 0) {
            const maxAllowed = 20 - totalImagesCount.value
            if (maxAllowed > 0) {
                handleImageSelect(event.dataTransfer.files, maxAllowed)
            } else {
                alert('已达到20张图片上限')
            }
        }
    }
}

// 在光标位置插入图片
const insertAtCursor = (image) => {
    const textarea = editorRef.value
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    const imageMarkdown = `![${image.alt || ''}](${image.serverUrl})\n`

    post.content =
        post.content.substring(0, start) +
        imageMarkdown +
        post.content.substring(end)

    // 移动光标到插入内容之后
    nextTick(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length
    })
}

// 发布文章
const publishPost = async () => {
    if (!auth.isAuthenticated.value) {
        alert('请先登录')
        return
    }

    if (!post.title.trim()) {
        alert('请输入文章标题')
        return
    }

    if (!post.content.trim()) {
        alert('请输入文章内容')
        return
    }

    if (uploadingBatches.value.length > 0) {
        alert('请等待所有图片上传完成')
        return
    }

    isPublishing.value = true

    try {
        await $pb.collection('posts').create({
            title: post.title,
            content: post.content,
            user: $pb.authStore.record?.id
        })

        alert('文章发布成功！')

        // 清空表单
        post.title = ''
        post.content = ''

        // 可选：清空图片（看需求）
        // imageBatches.value = []

    } catch (error) {
        console.error('发布失败:', error)
        alert('发布失败：' + error.message)
    } finally {
        isPublishing.value = false
    }
}
</script>

<style scoped>
.post-editor {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, sans-serif;
}

.title-input {
    width: 100%;
    padding: 12px;
    font-size: 24px;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 20px;
}

.editor-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 20px;
    height: calc(100vh - 200px);
}

/* 图片管理区 */
.image-manager {
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.image-toolbar {
    padding: 12px;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.image-toolbar h3 {
    margin: 0;
    font-size: 16px;
}

.upload-btn {
    padding: 6px 12px;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

.upload-progress {
    padding: 10px;
    background: #fff;
    border-bottom: 1px solid #ddd;
}

.progress-item {
    margin-bottom: 8px;
    font-size: 12px;
}

.progress-bar {
    height: 4px;
    background: #eee;
    border-radius: 2px;
    margin: 4px 0;
}

.progress-fill {
    height: 100%;
    background: #007aff;
    border-radius: 2px;
    transition: width 0.3s;
}

.image-grid {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
}

.image-item {
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
    background: white;
    transition: all 0.2s;
}

.image-item.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

.image-preview {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.2s;
}

.image-preview:hover .image-actions {
    opacity: 1;
}

.image-actions button {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-actions button:hover {
    background: rgba(0, 0, 0, 0.7);
}

.image-alt {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 4px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    font-size: 10px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
}

.insert-btn {
    width: 100%;
    padding: 6px;
    border: none;
    border-top: 1px solid #ddd;
    background: #f0f0f0;
    cursor: pointer;
    font-size: 12px;
}

.insert-btn:hover {
    background: #e0e0e0;
}

/* 编辑器区 */
.editor-area {
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.markdown-editor {
    flex: 1;
    padding: 15px;
    border: none;
    resize: none;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 14px;
    line-height: 1.6;
}

.markdown-editor:focus {
    outline: none;
}

.editor-footer {
    padding: 10px;
    border-top: 1px solid #ddd;
    background: #f9f9f9;
    display: flex;
    justify-content: flex-end;
}

.editor-footer button {
    padding: 4px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
}

.markdown-preview {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    background: #fff;
}

/* 发布栏 */
.publish-bar {
    margin-top: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.publish-btn {
    padding: 10px 24px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
}

.publish-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.publish-info {
    color: #666;
}

.image-batch {
    margin-bottom: 20px;
    border: 1px solid #eee;
    border-radius: 6px;
    overflow: hidden;
}

.batch-label {
    padding: 8px 12px;
    background: #f0f0f0;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.delete-batch-btn {
    padding: 2px 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
}

.delete-batch-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

.batch-images {
    padding: 10px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
}

.batch-progress {
    padding: 10px;
    background: #fff;
    border-bottom: 1px solid #ddd;
}

.batch-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-weight: bold;
}

.batch-files {
    margin-top: 8px;
    padding-left: 10px;
    font-size: 11px;
    color: #666;
}

.batch-file {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
}
</style>