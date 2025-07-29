<template>
  <div class="wage-overdue-config">
    <el-form 
      :model="formData" 
      :disabled="disabled"
      label-width="120px"
      size="default"
    >
      <!-- 预警规则配置 -->
      <el-form-item label="预警规则">
        <div class="rule-config">
          <span>农民工超过进场时间</span>
          <el-input-number
            v-model="formData.days"
            :min="1"
            :max="365"
            @change="handleRuleChange"
            style="width: 100px; margin: 0 8px;"
          />
          <span>个自然日后未发工资将进行预警</span>
        </div>
        <div class="rule-description">
          <el-alert
            :title="`当前规则：农民工超过进场时间${formData.days}个自然日后未发工资，在第${formData.days + 1}日进行预警`"
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
            title="此预警仅作提醒，触发后在首页弹出弹窗，业主方和施工单位可在预警查看页面按风险等级查看预警信息"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
      </el-form-item>

      <!-- 常用配置 -->
      <el-form-item label="快速配置" v-if="editMode">
        <div class="quick-config">
          <el-button-group>
            <el-button 
              size="small"
              @click="applyTemplate(30)"
            >
              30天
            </el-button>
            <el-button 
              size="small"
              @click="applyTemplate(60)"
            >
              60天
            </el-button>
            <el-button 
              size="small"
              @click="applyTemplate(90)"
            >
              90天
            </el-button>
          </el-button-group>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { WageOverdueWarningConfig, WarningLevel } from '../../types/warning'

interface Props {
  config: WageOverdueWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: WageOverdueWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const formData = reactive<{
  days: number
  level: WarningLevel
}>({
  days: props.config.days || 30,
  level: props.config.level
})

// 方法
const handleRuleChange = () => {
  emitUpdate()
}

const handleLevelChange = () => {
  emitUpdate()
}

const applyTemplate = (days: number) => {
  formData.days = days
  ElMessage.success(`已设置为${days}天`)
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: WageOverdueWarningConfig = {
    ...props.config,
    days: formData.days,
    level: formData.level,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.days = newConfig.days || 30
  formData.level = newConfig.level
}, { deep: true })
</script>

<style scoped lang="scss">
.wage-overdue-config {
  .rule-config {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
    
    span {
      color: #606266;
      font-size: 14px;
      white-space: nowrap;
    }
  }
  
  .rule-description,
  .processing-info {
    margin-bottom: 16px;
  }
  
  .quick-config {
    .el-button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .el-button {
        border-radius: 4px;
        margin: 0;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .wage-overdue-config {
    .rule-config {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .quick-config .el-button-group {
      flex-direction: column;
      width: 100%;
      
      .el-button {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>