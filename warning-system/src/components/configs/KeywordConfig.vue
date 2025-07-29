<template>
  <div class="keyword-config">
    <el-form 
      :model="formData" 
      :disabled="disabled"
      label-width="120px"
      size="default"
    >
      <!-- 关键字类型选择 -->
      <el-form-item label="关键字类型">
        <el-select 
          v-model="formData.keywordType" 
          placeholder="请选择关键字类型"
          @change="handleTypeChange"
        >
          <el-option 
            label="备注/摘要关键字" 
            value="remark"
          />
          <el-option 
            label="收款单位关键字" 
            value="payee"
          />
        </el-select>
      </el-form-item>

      <!-- 关键字列表 -->
      <el-form-item label="关键字设置">
        <div class="keywords-container">
          <div class="keywords-list">
            <el-tag
              v-for="(keyword, index) in formData.keywords"
              :key="index"
              closable
              type="info"
              @close="removeKeyword(index)"
              class="keyword-tag"
            >
              {{ keyword }}
            </el-tag>
          </div>
          
          <div class="add-keyword">
            <el-input
              v-model="newKeyword"
              placeholder="输入新关键字"
              @keyup.enter="addKeyword"
              class="keyword-input"
            >
              <template #append>
                <el-button 
                  @click="addKeyword"
                  :disabled="!newKeyword.trim()"
                >
                  添加
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </el-form-item>

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
            命中关键字时，在支付提交后给相关人员进行预警提示
          </p>
          <p v-else-if="formData.processingType === 'directReject'">
            <el-icon><WarningFilled /></el-icon>
            命中关键字时，直接拒绝提交，提示施工单位不允许提交
          </p>
          <p v-else-if="formData.processingType === 'ownerReview'">
            <el-icon><UserFilled /></el-icon>
            命中关键字时，将该笔支付单提交至业主复核
          </p>
        </div>
      </el-form-item>

      <!-- 批量导入 -->
      <el-form-item label="批量导入" v-if="editMode">
        <div class="batch-import">
          <el-upload
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="false"
            accept=".txt,.csv"
          >
            <el-button type="primary" plain>
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-upload>
          <span class="upload-tip">支持 .txt 和 .csv 文件，每行一个关键字</span>
        </div>
      </el-form-item>

      <!-- 预览效果 -->
      <el-form-item label="预览效果" v-if="formData.keywords.length > 0">
        <div class="preview-container">
          <el-alert
            :title="`已设置 ${formData.keywords.length} 个${formData.keywordType === 'remark' ? '备注/摘要' : '收款单位'}关键字`"
            type="success"
            :closable="false"
            show-icon
          />
          <div class="preview-keywords">
            <span 
              v-for="(keyword, index) in formData.keywords.slice(0, 5)" 
              :key="index"
              class="preview-keyword"
            >
              {{ keyword }}
            </span>
            <span v-if="formData.keywords.length > 5" class="more-keywords">
              ...等{{ formData.keywords.length - 5 }}个
            </span>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, WarningFilled, UserFilled, Upload } from '@element-plus/icons-vue'
import type { KeywordWarningConfig, KeywordType, WarningLevel, ProcessingType } from '../../types/warning'

interface Props {
  config: KeywordWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: KeywordWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const formData = reactive<{
  keywordType: KeywordType
  keywords: string[]
  level: WarningLevel
  processingType: ProcessingType
}>({
  keywordType: props.config.keywordType,
  keywords: [...props.config.keywords],
  level: props.config.level,
  processingType: props.config.processingType
})

const newKeyword = ref('')

// 方法
const addKeyword = () => {
  const keyword = newKeyword.value.trim()
  if (!keyword) return
  
  if (formData.keywords.includes(keyword)) {
    ElMessage.warning('关键字已存在')
    return
  }
  
  formData.keywords.push(keyword)
  newKeyword.value = ''
  emitUpdate()
}

const removeKeyword = (index: number) => {
  formData.keywords.splice(index, 1)
  emitUpdate()
}

const handleTypeChange = () => {
  emitUpdate()
}

const handleLevelChange = () => {
  emitUpdate()
}

const handleProcessingTypeChange = () => {
  emitUpdate()
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const keywords = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !formData.keywords.includes(line))
      
      if (keywords.length === 0) {
        ElMessage.warning('文件中没有有效的新关键字')
        return
      }
      
      formData.keywords.push(...keywords)
      ElMessage.success(`成功导入 ${keywords.length} 个关键字`)
      emitUpdate()
    } catch (error) {
      ElMessage.error('文件解析失败')
      console.error('File parse error:', error)
    }
  }
  reader.readAsText(file.raw)
}

const emitUpdate = () => {
  const updatedConfig: KeywordWarningConfig = {
    ...props.config,
    keywordType: formData.keywordType,
    keywords: [...formData.keywords],
    level: formData.level,
    processingType: formData.processingType,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.keywordType = newConfig.keywordType
  formData.keywords = [...newConfig.keywords]
  formData.level = newConfig.level
  formData.processingType = newConfig.processingType
}, { deep: true })

// 生命周期
onMounted(() => {
  // 初始化时如果没有关键字，给出提示
  if (formData.keywords.length === 0) {
    ElMessage.info('请添加关键字来配置预警规则')
  }
})
</script>

<style scoped lang="scss">
.keyword-config {
  .keywords-container {
    width: 100%;
    
    .keywords-list {
      margin-bottom: 12px;
      min-height: 40px;
      padding: 8px;
      border: 1px dashed #d9d9d9;
      border-radius: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      
      &:empty::before {
        content: '暂无关键字，请添加';
        color: #999;
        font-style: italic;
      }
      
      .keyword-tag {
        margin: 0;
      }
    }
    
    .add-keyword {
      .keyword-input {
        max-width: 300px;
      }
    }
  }
  
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
  
  .batch-import {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .upload-tip {
      font-size: 12px;
      color: #999;
    }
  }
  
  .preview-container {
    .preview-keywords {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      
      .preview-keyword {
        padding: 2px 8px;
        background-color: #e6f7ff;
        border: 1px solid #91d5ff;
        border-radius: 12px;
        font-size: 12px;
        color: #1890ff;
      }
      
      .more-keywords {
        padding: 2px 8px;
        color: #999;
        font-size: 12px;
        font-style: italic;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .keyword-config {
    .keywords-container .add-keyword .keyword-input {
      max-width: 100%;
    }
    
    .batch-import {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>