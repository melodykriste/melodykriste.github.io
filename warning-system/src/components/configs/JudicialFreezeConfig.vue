<template>
  <div class="judicial-freeze-config">
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
            title="监管账户发生司法冻结或司法扣划被抽走，则进行预警"
            type="warning"
            :closable="false"
            show-icon
          />
          <p class="rule-note">此预警默认为高风险等级，不可修改</p>
        </div>
      </el-form-item>

      <!-- 预警级别（固定为高风险） -->
      <el-form-item label="预警级别">
        <el-tag type="danger" size="large">高风险（固定）</el-tag>
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
            该账户命中预警规则时，首页弹出预警信息，提交支取时弹出预警信息
          </p>
          <p v-else-if="formData.processingType === 'directReject'">
            <el-icon><WarningFilled /></el-icon>
            命中预警规则后，所有该监管账户的支取无法提交
          </p>
          <p v-else-if="formData.processingType === 'ownerReview'">
            <el-icon><UserFilled /></el-icon>
            命中预警规则后，所有该监管账户的支取提交至业主审核
          </p>
        </div>
      </el-form-item>

      <!-- 高风险提醒 -->
      <el-form-item label="风险提醒">
        <el-alert
          title="司法冻结预警属于高风险预警，建议设置为直接拒绝或业主审核"
          type="error"
          :closable="false"
          show-icon
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { InfoFilled, WarningFilled, UserFilled } from '@element-plus/icons-vue'
import type { JudicialFreezeWarningConfig, ProcessingType } from '../../types/warning'
import { WarningLevel } from '../../types/warning'

interface Props {
  config: JudicialFreezeWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: JudicialFreezeWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const formData = reactive<{
  processingType: ProcessingType
}>({
  processingType: props.config.processingType
})

// 方法
const handleProcessingTypeChange = () => {
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: JudicialFreezeWarningConfig = {
    ...props.config,
    level: WarningLevel.HIGH, // 司法冻结固定为高风险
    processingType: formData.processingType,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.processingType = newConfig.processingType
}, { deep: true })
</script>

<style scoped lang="scss">
.judicial-freeze-config {
  .rule-description {
    margin-bottom: 16px;
    
    .rule-note {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
      font-style: italic;
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
}
</style>