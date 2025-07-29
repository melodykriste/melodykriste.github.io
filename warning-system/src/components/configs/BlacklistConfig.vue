<template>
  <div class="blacklist-config">
    <el-form 
      :model="formData" 
      :disabled="disabled"
      label-width="120px"
      size="default"
    >
      <!-- 预警级别 -->
      <el-form-item label="预警级别">
        <el-radio-group 
          v-model="formData.level"
          @change="handleLevelChange"
        >
          <el-radio label="medium">中风险</el-radio>
          <el-radio label="high">高风险</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 处置方式 -->
      <el-form-item label="处置方式">
        <el-radio-group 
          v-model="formData.processingType"
          @change="handleProcessingTypeChange"
        >
          <el-radio label="viewOnly">仅查看</el-radio>
          <el-radio label="directReject">直接拒绝</el-radio>
          <el-radio label="ownerReview">业主审核</el-radio>
        </el-radio-group>
        
        <div class="processing-description">
          <p v-if="formData.processingType === 'viewOnly'">
            <el-icon><InfoFilled /></el-icon>
            命中黑名单时，在支付提交后给相关人员进行预警提示
          </p>
          <p v-else-if="formData.processingType === 'directReject'">
            <el-icon><WarningFilled /></el-icon>
            命中黑名单时，直接拒绝提交，提示施工单位不允许提交
          </p>
          <p v-else-if="formData.processingType === 'ownerReview'">
            <el-icon><UserFilled /></el-icon>
            命中黑名单时，将该笔支付单提交至业主复核
          </p>
        </div>
      </el-form-item>

      <!-- 黑名单文件上传 -->
      <el-form-item label="设置止付名单" v-if="editMode">
        <div class="blacklist-upload">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileSelect"
            :on-remove="handleFileRemove"
            :before-upload="beforeUpload"
            :file-list="fileList"
            drag
            accept=".xlsx,.xls,.csv"
            class="upload-area"
          >
            <el-icon class="el-icon--upload">
              <UploadFilled />
            </el-icon>
            <div class="el-upload__text">
              将黑名单文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx, .xls, .csv 格式文件，文件大小不超过2MB
              </div>
            </template>
          </el-upload>
          
          <div class="upload-actions">
            <el-button 
              type="primary" 
              @click="handleUpload"
              :loading="uploading"
              :disabled="!selectedFile"
            >
              <el-icon><Upload /></el-icon>
              上传文件
            </el-button>
            <el-button 
              type="success" 
              plain
              @click="downloadTemplate"
            >
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>
          </div>
        </div>
      </el-form-item>

      <!-- 当前黑名单查看 -->
      <el-form-item label="当前名单">
        <div class="blacklist-viewer">
          <div class="viewer-header">
            <span class="count-info">
              共 {{ formData.blacklistData.length }} 条记录
            </span>
            <el-button 
              type="primary" 
              size="small"
              @click="viewCurrentList"
            >
              查看当前名单
            </el-button>
          </div>
          
          <div class="blacklist-preview" v-if="formData.blacklistData.length > 0">
            <el-table 
              :data="formData.blacklistData.slice(0, 5)" 
              size="small"
              class="preview-table"
            >
              <el-table-column prop="payeeName" label="收款方名称" />
              <el-table-column prop="accountNumber" label="账号" />
            </el-table>
            <div 
              v-if="formData.blacklistData.length > 5" 
              class="more-records"
            >
              ...还有 {{ formData.blacklistData.length - 5 }} 条记录
            </div>
          </div>
          
          <el-empty 
            v-else
            description="暂无黑名单数据"
            :image-size="60"
          />
        </div>
      </el-form-item>

      <!-- 手动添加 -->
      <el-form-item label="手动添加" v-if="editMode">
        <div class="manual-add">
          <el-form 
            :model="newItem" 
            inline 
            size="small"
            @submit.prevent="addBlacklistItem"
          >
            <el-form-item label="收款方名称">
              <el-input 
                v-model="newItem.payeeName" 
                placeholder="请输入收款方名称"
                style="width: 200px;"
              />
            </el-form-item>
            <el-form-item label="账号">
              <el-input 
                v-model="newItem.accountNumber" 
                placeholder="请输入账号"
                style="width: 200px;"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="addBlacklistItem"
                :disabled="!newItem.payeeName.trim() || !newItem.accountNumber.trim()"
              >
                添加
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-form-item>
    </el-form>

    <!-- 黑名单详情对话框 -->
    <el-dialog
      v-model="listDialogVisible"
      title="当前黑名单详情"
      width="70%"
      :close-on-click-modal="false"
    >
      <div class="blacklist-detail">
        <div class="detail-header">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索收款方名称或账号"
            clearable
            style="width: 300px;"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button 
            type="danger" 
            @click="clearAllBlacklist"
            :disabled="!canEditWarnings || formData.blacklistData.length === 0"
          >
            清空名单
          </el-button>
        </div>
        
        <el-table 
          :data="filteredBlacklistData" 
          height="400"
          class="detail-table"
        >
          <el-table-column prop="payeeName" label="收款方名称" sortable />
          <el-table-column prop="accountNumber" label="账号" sortable />
          <el-table-column 
            label="操作" 
            width="80"
            v-if="canEditWarnings"
          >
            <template #default="{ row, $index }">
              <el-button 
                type="danger" 
                size="small" 
                text
                @click="removeBlacklistItem($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  InfoFilled, 
  WarningFilled, 
  UserFilled, 
  UploadFilled,
  Upload,
  Download,
  Search
} from '@element-plus/icons-vue'
import type { BlacklistWarningConfig, WarningLevel, ProcessingType } from '../../types/warning'
import { useWarningStore } from '../../stores/warningStore'

interface Props {
  config: BlacklistWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: BlacklistWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

const warningStore = useWarningStore()

// 响应式数据
const formData = reactive<{
  level: WarningLevel
  processingType: ProcessingType
  blacklistData: Array<{ payeeName: string; accountNumber: string }>
}>({
  level: props.config.level,
  processingType: props.config.processingType,
  blacklistData: [...props.config.blacklistData]
})

const selectedFile = ref<File | null>(null)
const fileList = ref<any[]>([])
const uploading = ref(false)
const listDialogVisible = ref(false)
const searchKeyword = ref('')
const uploadRef = ref()

const newItem = reactive({
  payeeName: '',
  accountNumber: ''
})

// 计算属性
const canEditWarnings = computed(() => warningStore.canEditWarnings)

const filteredBlacklistData = computed(() => {
  if (!searchKeyword.value) {
    return formData.blacklistData
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return formData.blacklistData.filter(item => 
    item.payeeName.toLowerCase().includes(keyword) ||
    item.accountNumber.toLowerCase().includes(keyword)
  )
})

// 方法
const handleLevelChange = () => {
  emitUpdate()
}

const handleProcessingTypeChange = () => {
  emitUpdate()
}

const handleFileSelect = (file: any) => {
  selectedFile.value = file.raw
}

const handleFileRemove = () => {
  selectedFile.value = null
}

const beforeUpload = (file: File) => {
  const isValidType = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type)
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isValidType) {
    ElMessage.error('只能上传 Excel 或 CSV 文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('文件大小不能超过 2MB!')
    return false
  }
  return false // 阻止默认上传行为
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    uploading.value = true
    const result = await warningStore.uploadBlacklist(selectedFile.value)
    
    formData.blacklistData = result.data
    selectedFile.value = null
    fileList.value = []
    
    ElMessage.success(`成功上传 ${result.data.length} 条黑名单记录`)
    emitUpdate()
  } catch (error) {
    ElMessage.error('上传失败')
    console.error('Upload failed:', error)
  } finally {
    uploading.value = false
  }
}

const downloadTemplate = () => {
  // 创建一个简单的CSV模板
  const csvContent = 'data:text/csv;charset=utf-8,收款方名称,账号\n示例公司,1234567890123456\n测试企业,9876543210987654'
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', '黑名单模板.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const addBlacklistItem = () => {
  const payeeName = newItem.payeeName.trim()
  const accountNumber = newItem.accountNumber.trim()
  
  if (!payeeName || !accountNumber) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  // 检查是否已存在
  const exists = formData.blacklistData.some(item => 
    item.payeeName === payeeName && item.accountNumber === accountNumber
  )
  
  if (exists) {
    ElMessage.warning('该记录已存在')
    return
  }
  
  formData.blacklistData.push({ payeeName, accountNumber })
  newItem.payeeName = ''
  newItem.accountNumber = ''
  
  ElMessage.success('添加成功')
  emitUpdate()
}

const removeBlacklistItem = (index: number) => {
  formData.blacklistData.splice(index, 1)
  ElMessage.success('删除成功')
  emitUpdate()
}

const clearAllBlacklist = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有黑名单记录吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    formData.blacklistData = []
    ElMessage.success('已清空黑名单')
    emitUpdate()
  } catch (error) {
    // 用户取消操作
  }
}

const viewCurrentList = () => {
  listDialogVisible.value = true
}

const emitUpdate = () => {
  const updatedConfig: BlacklistWarningConfig = {
    ...props.config,
    level: formData.level,
    processingType: formData.processingType,
    blacklistData: [...formData.blacklistData],
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.level = newConfig.level
  formData.processingType = newConfig.processingType
  formData.blacklistData = [...newConfig.blacklistData]
}, { deep: true })
</script>

<style scoped lang="scss">
.blacklist-config {
  .processing-description {
    margin-top: 8px;
    
    p {
      margin: 0;
      padding: 8px 12px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-size: 13px;
      color: #606266;
      display: flex;
      align-items: center;
      gap: 6px;
      
      .el-icon {
        color: #409eff;
      }
    }
  }
  
  .blacklist-upload {
    .upload-area {
      margin-bottom: 16px;
    }
    
    .upload-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .blacklist-viewer {
    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .count-info {
        color: #606266;
        font-size: 14px;
      }
    }
    
    .blacklist-preview {
      .preview-table {
        margin-bottom: 8px;
      }
      
      .more-records {
        text-align: center;
        color: #999;
        font-size: 12px;
        font-style: italic;
      }
    }
  }
  
  .manual-add {
    padding: 16px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
  }
}

.blacklist-detail {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .detail-table {
    border: 1px solid #ebeef5;
    border-radius: 4px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .blacklist-config {
    .blacklist-viewer .viewer-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .blacklist-upload .upload-actions {
      flex-direction: column;
    }
    
    .manual-add .el-form {
      flex-direction: column;
      
      .el-form-item {
        margin-right: 0;
        margin-bottom: 12px;
      }
    }
  }
  
  .blacklist-detail .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>