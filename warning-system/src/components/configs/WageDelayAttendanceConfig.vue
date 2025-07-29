<template>
  <div class="wage-delay-attendance-config">
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
            title="农民工已有考勤，但在考勤当月及次月均未发放工资预警，则在第三个月触发预警"
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

      <!-- 处置方式说明 -->
      <el-form-item label="处置方式">
        <div class="processing-info">
          <el-alert
            title="此预警仅作提醒，触发后在首页弹出弹窗，预警详情信息包括该农民工的考勤本月考勤信息、上个月考勤信息"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { WageDelayAttendanceWarningConfig, WarningLevel } from '../../types/warning'

interface Props {
  config: WageDelayAttendanceWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: WageDelayAttendanceWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

const formData = reactive<{
  level: WarningLevel
}>({
  level: props.config.level
})

const handleLevelChange = () => {
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: WageDelayAttendanceWarningConfig = {
    ...props.config,
    level: formData.level,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

watch(() => props.config, (newConfig) => {
  formData.level = newConfig.level
}, { deep: true })
</script>

<style scoped lang="scss">
.wage-delay-attendance-config {
  .rule-description,
  .processing-info {
    margin-bottom: 16px;
  }
}
</style>