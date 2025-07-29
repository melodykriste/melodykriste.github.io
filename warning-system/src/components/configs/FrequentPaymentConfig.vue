<template>
  <div class="frequent-payment-config">
    <el-form 
      :model="formData" 
      :disabled="disabled"
      label-width="120px"
      size="default"
    >
      <!-- 预警规则配置 -->
      <el-form-item label="预警规则">
        <div class="rule-config">
          <span>同一收款人</span>
          <el-input-number
            v-model="formData.days"
            :min="1"
            :max="365"
            @change="handleRuleChange"
            style="width: 100px; margin: 0 8px;"
          />
          <span>日内累计付款</span>
          <el-input-number
            v-model="formData.times"
            :min="2"
            :max="100"
            @change="handleRuleChange"
            style="width: 100px; margin: 0 8px;"
          />
          <span>次以上预警</span>
        </div>
        <div class="rule-description">
          <el-alert
            :title="`当前规则：同一收款人${formData.days}日内累计付款${formData.times}次以上时触发预警`"
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
            在第{{ formData.times }}次付款时，命中该预警，给相关人员进行预警提示并在首页弹出弹窗
          </p>
          <p v-else-if="formData.processingType === 'directReject'">
            <el-icon><WarningFilled /></el-icon>
            在第{{ formData.times }}次命中预警规则后，直接拒绝提交，提示施工单位不允许提交
          </p>
          <p v-else-if="formData.processingType === 'ownerReview'">
            <el-icon><UserFilled /></el-icon>
            在第{{ formData.times }}次命中预警规则后，将该笔支付单提交至业主复核
          </p>
        </div>
      </el-form-item>

      <!-- 示例场景 -->
      <el-form-item label="示例场景" v-if="editMode">
        <div class="example-scenario">
          <el-card class="scenario-card">
            <template #header>
              <span>预警触发示例</span>
            </template>
            <div class="scenario-content">
              <el-timeline>
                <el-timeline-item
                  v-for="(item, index) in exampleScenario"
                  :key="index"
                  :type="item.type"
                  :icon="item.icon"
                  :timestamp="item.timestamp"
                >
                  {{ item.content }}
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-card>
        </div>
      </el-form-item>

      <!-- 常用配置模板 -->
      <el-form-item label="快速配置" v-if="editMode">
        <div class="quick-config">
          <el-button-group>
            <el-button 
              size="small"
              @click="applyTemplate('conservative')"
            >
              保守模式 (7日3次)
            </el-button>
            <el-button 
              size="small"
              @click="applyTemplate('balanced')"
            >
              平衡模式 (30日3次)
            </el-button>
            <el-button 
              size="small"
              @click="applyTemplate('relaxed')"
            >
              宽松模式 (30日5次)
            </el-button>
          </el-button-group>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, WarningFilled, UserFilled, Clock, Warning } from '@element-plus/icons-vue'
import type { FrequentPaymentWarningConfig, WarningLevel, ProcessingType } from '../../types/warning'

interface Props {
  config: FrequentPaymentWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: FrequentPaymentWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const formData = reactive<{
  days: number
  times: number
  level: WarningLevel
  processingType: ProcessingType
}>({
  days: props.config.days || 30,
  times: props.config.times || 3,
  level: props.config.level,
  processingType: props.config.processingType
})

// 计算属性
const exampleScenario = computed(() => {
  const baseDate = new Date()
  const scenarios = []
  
  for (let i = 1; i <= formData.times; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - (formData.days - i * Math.floor(formData.days / formData.times)))
    
    scenarios.push({
      timestamp: date.toLocaleDateString(),
      content: `第${i}次向"ABC建筑公司"付款 ¥50,000`,
      type: i === formData.times ? 'danger' : 'primary',
      icon: i === formData.times ? Warning : Clock
    })
  }
  
  if (formData.times > 1) {
    scenarios.push({
      timestamp: '触发时刻',
      content: `🚨 触发频繁付款预警！${formData.days}日内向同一收款人付款${formData.times}次`,
      type: 'danger',
      icon: Warning
    })
  }
  
  return scenarios
})

// 方法
const handleRuleChange = () => {
  emitUpdate()
}

const handleLevelChange = () => {
  emitUpdate()
}

const handleProcessingTypeChange = () => {
  emitUpdate()
}

const applyTemplate = (template: string) => {
  switch (template) {
    case 'conservative':
      formData.days = 7
      formData.times = 3
      break
    case 'balanced':
      formData.days = 30
      formData.times = 3
      break
    case 'relaxed':
      formData.days = 30
      formData.times = 5
      break
  }
  
  ElMessage.success(`已应用${template === 'conservative' ? '保守' : template === 'balanced' ? '平衡' : '宽松'}模式配置`)
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: FrequentPaymentWarningConfig = {
    ...props.config,
    days: formData.days,
    times: formData.times,
    level: formData.level,
    processingType: formData.processingType,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.days = newConfig.days || 30
  formData.times = newConfig.times || 3
  formData.level = newConfig.level
  formData.processingType = newConfig.processingType
}, { deep: true })
</script>

<style scoped lang="scss">
.frequent-payment-config {
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
  
  .rule-description {
    .el-alert {
      margin-top: 8px;
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
  
  .example-scenario {
    .scenario-card {
      max-width: 600px;
      
      .scenario-content {
        .el-timeline {
          padding-left: 0;
        }
      }
    }
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
  .frequent-payment-config {
    .rule-config {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      
      span {
        display: block;
        margin-bottom: 4px;
      }
    }
    
    .quick-config .el-button-group {
      flex-direction: column;
      width: 100%;
      
      .el-button {
        width: 100%;
        justify-content: center;
      }
    }
    
    .example-scenario .scenario-card {
      max-width: 100%;
    }
  }
}
</style>