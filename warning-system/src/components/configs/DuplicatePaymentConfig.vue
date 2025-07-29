<template>
  <div class="duplicate-payment-config">
    <el-form 
      :model="formData" 
      :disabled="disabled"
      label-width="120px"
      size="default"
    >
      <!-- 预警规则说明 -->
      <el-form-item label="预警规则">
        <div class="rule-description">
          <el-alert
            title="月度内发生付款账户、收款账户以及金额相同的支付则进行预警"
            type="info"
            :closable="false"
            show-icon
          />
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
            在第二次发生收付方、金额都相同的交易后，给相关人员进行预警提示
          </p>
          <p v-else-if="formData.processingType === 'directReject'">
            <el-icon><WarningFilled /></el-icon>
            命中预警规则后，直接拒绝提交，提示施工单位不允许提交
          </p>
          <p v-else-if="formData.processingType === 'ownerReview'">
            <el-icon><UserFilled /></el-icon>
            命中预警规则后，将该笔支付单提交至业主复核
          </p>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { InfoFilled, WarningFilled, UserFilled } from '@element-plus/icons-vue'
import type { DuplicatePaymentWarningConfig, WarningLevel, ProcessingType } from '../../types/warning'

interface Props {
  config: DuplicatePaymentWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: DuplicatePaymentWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const formData = reactive<{
  level: WarningLevel
  processingType: ProcessingType
}>({
  level: props.config.level,
  processingType: props.config.processingType
})

// 方法
const handleLevelChange = () => {
  emitUpdate()
}

const handleProcessingTypeChange = () => {
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: DuplicatePaymentWarningConfig = {
    ...props.config,
    level: formData.level,
    processingType: formData.processingType,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.level = newConfig.level
  formData.processingType = newConfig.processingType
}, { deep: true })
</script>

<style scoped lang="scss">
.duplicate-payment-config {
  .rule-description {
    margin-bottom: 16px;
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
}
</style>