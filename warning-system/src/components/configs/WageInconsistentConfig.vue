<template>
  <div class="wage-inconsistent-config">
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
            title="农民工在工资表中有工资数据，但在实际代发时和工资表的应发金额不一致则进行预警"
            type="warning"
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
            该代发命中预警规则时，首页弹出预警信息，提交代发后提示用户该预警信息
          </p>
          <p v-else-if="formData.processingType === 'directReject'">
            <el-icon><WarningFilled /></el-icon>
            该代发命中预警规则后，拒绝该笔代发
          </p>
          <p v-else-if="formData.processingType === 'ownerReview'">
            <el-icon><UserFilled /></el-icon>
            命中预警规则后，该笔代发提交至业主审核
          </p>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { InfoFilled, WarningFilled, UserFilled } from '@element-plus/icons-vue'
import type { WageInconsistentWarningConfig, WarningLevel, ProcessingType } from '../../types/warning'

interface Props {
  config: WageInconsistentWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: WageInconsistentWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

const formData = reactive<{
  level: WarningLevel
  processingType: ProcessingType
}>({
  level: props.config.level,
  processingType: props.config.processingType
})

const handleLevelChange = () => {
  emitUpdate()
}

const handleProcessingTypeChange = () => {
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: WageInconsistentWarningConfig = {
    ...props.config,
    level: formData.level,
    processingType: formData.processingType,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

watch(() => props.config, (newConfig) => {
  formData.level = newConfig.level
  formData.processingType = newConfig.processingType
}, { deep: true })
</script>

<style scoped lang="scss">
.wage-inconsistent-config {
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