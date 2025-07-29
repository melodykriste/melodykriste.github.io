<template>
  <div class="wage-misuse-config">
    <el-form 
      :model="formData" 
      :disabled="disabled"
      label-width="120px"
      size="default"
    >
      <!-- 预警规则配置 -->
      <el-form-item label="预警规则">
        <div class="rule-config">
          <p class="rule-formula">
            某农民工工资发放金额 / 该项目部历史平均农民工工资 > 
            <el-input-number
              v-model="formData.multiplierA"
              :min="1"
              :max="10"
              :step="0.1"
              :precision="1"
              @change="handleRuleChange"
              style="width: 100px; margin: 0 4px;"
            />
            倍 或 >
            <el-input-number
              v-model="formData.multiplierB"
              :min="1"
              :max="10"
              :step="0.1"
              :precision="1"
              @change="handleRuleChange"
              style="width: 100px; margin: 0 4px;"
            />
            倍时触发预警
          </p>
        </div>
        <div class="rule-description">
          <el-alert
            :title="`当前规则：农民工工资发放金额超过历史平均数${formData.multiplierA}倍或${formData.multiplierB}倍时触发预警`"
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
        <div class="level-tips">
          <el-text size="small" type="info">
            建议：超过3倍设为中风险，超过5倍设为高风险
          </el-text>
        </div>
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
            该代发支付命中预警规则时，首页弹出预警信息，提交支取时弹出预警信息
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

      <!-- 示例计算 -->
      <el-form-item label="示例计算" v-if="editMode">
        <div class="example-calculation">
          <el-card class="calculation-card">
            <template #header>
              <span>预警触发示例</span>
            </template>
            <div class="calculation-content">
              <div class="calc-item">
                <span class="calc-label">项目历史平均工资：</span>
                <span class="calc-value">¥5,000</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">当前发放工资：</span>
                <span class="calc-value">¥{{ (5000 * formData.multiplierA).toLocaleString() }}</span>
              </div>
              <div class="calc-item">
                <span class="calc-label">倍数：</span>
                <span class="calc-value">{{ formData.multiplierA }}倍</span>
              </div>
              <div class="calc-result">
                <el-tag type="warning">触发预警！</el-tag>
              </div>
            </div>
          </el-card>
        </div>
      </el-form-item>

      <!-- 快速配置 -->
      <el-form-item label="快速配置" v-if="editMode">
        <div class="quick-config">
          <el-button-group>
            <el-button 
              size="small"
              @click="applyTemplate('strict')"
            >
              严格模式 (2倍/3倍)
            </el-button>
            <el-button 
              size="small"
              @click="applyTemplate('normal')"
            >
              标准模式 (3倍/5倍)
            </el-button>
            <el-button 
              size="small"
              @click="applyTemplate('loose')"
            >
              宽松模式 (5倍/8倍)
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
import { InfoFilled, WarningFilled, UserFilled } from '@element-plus/icons-vue'
import type { WageMisuseWarningConfig, WarningLevel, ProcessingType } from '../../types/warning'

interface Props {
  config: WageMisuseWarningConfig
  disabled?: boolean
  editMode?: boolean
}

interface Emits {
  (e: 'update', config: WageMisuseWarningConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  editMode: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const formData = reactive<{
  multiplierA: number
  multiplierB: number
  level: WarningLevel
  processingType: ProcessingType
}>({
  multiplierA: props.config.multiplierA || 3,
  multiplierB: props.config.multiplierB || 5,
  level: props.config.level,
  processingType: props.config.processingType
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
    case 'strict':
      formData.multiplierA = 2
      formData.multiplierB = 3
      break
    case 'normal':
      formData.multiplierA = 3
      formData.multiplierB = 5
      break
    case 'loose':
      formData.multiplierA = 5
      formData.multiplierB = 8
      break
  }
  
  ElMessage.success(`已应用${template === 'strict' ? '严格' : template === 'normal' ? '标准' : '宽松'}模式配置`)
  emitUpdate()
}

const emitUpdate = () => {
  const updatedConfig: WageMisuseWarningConfig = {
    ...props.config,
    multiplierA: formData.multiplierA,
    multiplierB: formData.multiplierB,
    level: formData.level,
    processingType: formData.processingType,
    updatedAt: new Date().toISOString()
  }
  emit('update', updatedConfig)
}

// 监听配置变化
watch(() => props.config, (newConfig) => {
  formData.multiplierA = newConfig.multiplierA || 3
  formData.multiplierB = newConfig.multiplierB || 5
  formData.level = newConfig.level
  formData.processingType = newConfig.processingType
}, { deep: true })
</script>

<style scoped lang="scss">
.wage-misuse-config {
  .rule-config {
    margin-bottom: 12px;
    
    .rule-formula {
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }
  }
  
  .rule-description {
    margin-bottom: 16px;
  }
  
  .level-tips {
    margin-top: 8px;
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
  
  .example-calculation {
    .calculation-card {
      max-width: 400px;
      
      .calculation-content {
        .calc-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          
          .calc-label {
            color: #606266;
            font-size: 14px;
          }
          
          .calc-value {
            font-weight: 500;
            color: #303133;
          }
        }
        
        .calc-result {
          margin-top: 16px;
          text-align: center;
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
  .wage-misuse-config {
    .rule-config .rule-formula {
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
    
    .example-calculation .calculation-card {
      max-width: 100%;
    }
  }
}
</style>