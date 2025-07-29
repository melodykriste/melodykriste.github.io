<template>
  <teleport to="body">
    <div v-if="visible" class="warning-alert-overlay">
      <div class="warning-alert-container">
        <el-card 
          class="warning-alert-card"
          :class="[`alert-${warning?.level}`]"
        >
          <template #header>
            <div class="alert-header">
              <div class="header-left">
                <el-icon class="warning-icon">
                  <WarningFilled v-if="warning?.level === 'high'" />
                  <Warning v-else />
                </el-icon>
                <span class="alert-title">{{ alertTitle }}</span>
              </div>
              <div class="header-right">
                <el-button 
                  type="text" 
                  size="small"
                  @click="handleClose"
                  class="close-btn"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </template>

          <div class="alert-content">
            <div class="warning-info">
              <div class="info-row">
                <span class="label">预警类型：</span>
                <el-tag 
                  :type="getWarningTypeTagType(warning?.type)"
                  size="small"
                >
                  {{ getWarningTypeName(warning?.type) }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="label">风险等级：</span>
                <el-tag 
                  :type="warning?.level === 'high' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ warning?.level === 'high' ? '高风险' : '中风险' }}
                </el-tag>
              </div>
              <div class="info-row">
                <span class="label">触发时间：</span>
                <span class="value">{{ formatDateTime(warning?.triggeredAt) }}</span>
              </div>
            </div>

            <div class="warning-message">
              <h4>预警信息</h4>
              <p>{{ warning?.message }}</p>
            </div>

            <div v-if="warning?.details" class="warning-details">
              <h4>详细信息</h4>
              <div class="details-content">
                <template v-if="warning.type === 'keyword'">
                  <p><strong>命中关键字：</strong>{{ warning.details.keyword }}</p>
                  <p><strong>关键字类型：</strong>{{ warning.details.keywordType === 'remark' ? '备注/摘要' : '收款单位' }}</p>
                </template>
                <template v-else-if="warning.type === 'blacklist'">
                  <p><strong>黑名单收款方：</strong>{{ warning.details.payeeName }}</p>
                  <p><strong>账号：</strong>{{ warning.details.accountNumber }}</p>
                </template>
                <template v-else-if="warning.type === 'frequentPayment'">
                  <p><strong>收款方：</strong>{{ warning.details.payeeName }}</p>
                  <p><strong>时间范围：</strong>{{ warning.details.days }}日内</p>
                  <p><strong>付款次数：</strong>{{ warning.details.times }}次</p>
                </template>
                <template v-else-if="warning.type === 'wageMisuse'">
                  <p><strong>农民工姓名：</strong>{{ warning.details.workerName }}</p>
                  <p><strong>发放金额：</strong>¥{{ warning.details.amount?.toLocaleString() }}</p>
                  <p><strong>历史平均：</strong>¥{{ warning.details.averageAmount?.toLocaleString() }}</p>
                  <p><strong>倍数：</strong>{{ warning.details.multiplier }}倍</p>
                </template>
                <template v-else>
                  <pre class="details-json">{{ JSON.stringify(warning.details, null, 2) }}</pre>
                </template>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="alert-actions">
              <el-button 
                size="small"
                @click="handleViewHistory"
              >
                查看预警历史
              </el-button>
              <el-button 
                v-if="showProcessButton"
                type="primary" 
                size="small"
                @click="handleProcess"
              >
                立即处理
              </el-button>
              <el-button 
                type="info" 
                size="small"
                @click="handleClose"
              >
                稍后处理
              </el-button>
            </div>
          </template>
        </el-card>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, Warning, Close } from '@element-plus/icons-vue'
import type { WarningRecord, WarningType } from '../types/warning'
import { useWarningStore } from '../stores/warningStore'
import dayjs from 'dayjs'

interface Props {
  visible: boolean
  warning: WarningRecord | null
  autoClose?: boolean
  autoCloseDelay?: number
}

interface Emits {
  (e: 'close'): void
  (e: 'process', warning: WarningRecord): void
  (e: 'view-history'): void
}

const props = withDefaults(defineProps<Props>(), {
  autoClose: false,
  autoCloseDelay: 5000
})

const emit = defineEmits<Emits>()

const warningStore = useWarningStore()

// 计算属性
const alertTitle = computed(() => {
  if (!props.warning) return '系统预警'
  
  const levelText = props.warning.level === 'high' ? '高风险' : '中风险'
  return `${levelText}预警提醒`
})

const showProcessButton = computed(() => {
  return props.warning && 
         !props.warning.processed && 
         warningStore.canEditWarnings &&
         props.warning.processingType !== 'viewOnly'
})

// 预警类型映射
const warningTypeMap = {
  keyword: '关键字预警',
  blacklist: '黑名单预警',
  duplicatePayment: '重复性预警（收付款方金额相同）',
  frequentPayment: '重复性预警（同一收款人多次付款）',
  judicialFreeze: '司法冻结和扣划预警',
  wageMisuse: '资金挪用预警（农民工工资超平均数）',
  relatedParty: '关联方预警',
  paymentMisuse: '资金挪用预警（代发支付混用）',
  wageDelayAttendance: '拖欠农民工预警（已有考勤未发工资）',
  wageInconsistent: '拖欠农民工预警（实发应发不一致）',
  wageOverdue: '拖欠农民工预警（超期未发工资预警）'
}

// 方法
const getWarningTypeName = (type?: WarningType): string => {
  if (!type) return '未知类型'
  return warningTypeMap[type] || type
}

const getWarningTypeTagType = (type?: WarningType): string => {
  if (!type) return 'info'
  
  const dangerTypes = ['judicialFreeze', 'wageMisuse', 'paymentMisuse']
  const warningTypes = ['blacklist', 'frequentPayment', 'wageInconsistent']
  
  if (dangerTypes.includes(type)) return 'danger'
  if (warningTypes.includes(type)) return 'warning'
  return 'info'
}

const formatDateTime = (dateTime?: string): string => {
  if (!dateTime) return '--'
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

const handleClose = () => {
  emit('close')
}

const handleProcess = () => {
  if (props.warning) {
    emit('process', props.warning)
  }
}

const handleViewHistory = () => {
  emit('view-history')
  handleClose()
}

// 自动关闭
if (props.autoClose && props.autoCloseDelay > 0) {
  setTimeout(() => {
    if (props.visible) {
      handleClose()
    }
  }, props.autoCloseDelay)
}
</script>

<style scoped lang="scss">
.warning-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.warning-alert-container {
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.warning-alert-card {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  animation: alertSlideIn 0.3s ease-out;
  
  &.alert-high {
    border-left: 4px solid #f56c6c;
    
    .alert-header {
      background: linear-gradient(135deg, #f56c6c 0%, #ff8a80 100%);
      color: white;
    }
  }
  
  &.alert-medium {
    border-left: 4px solid #e6a23c;
    
    .alert-header {
      background: linear-gradient(135deg, #e6a23c 0%, #ffb74d 100%);
      color: white;
    }
  }
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin: -20px -20px 20px -20px;
  border-radius: 8px 8px 0 0;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .warning-icon {
      font-size: 24px;
      animation: pulse 2s infinite;
    }
    
    .alert-title {
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .close-btn {
    color: rgba(255, 255, 255, 0.8);
    
    &:hover {
      color: white;
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}

.alert-content {
  .warning-info {
    margin-bottom: 20px;
    
    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .label {
        min-width: 80px;
        color: #606266;
        font-size: 14px;
      }
      
      .value {
        color: #303133;
        font-size: 14px;
      }
    }
  }
  
  .warning-message,
  .warning-details {
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
      font-size: 16px;
      font-weight: 600;
    }
    
    p {
      margin: 8px 0;
      color: #606266;
      line-height: 1.6;
    }
  }
  
  .details-content {
    background-color: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    
    .details-json {
      font-size: 12px;
      line-height: 1.5;
      color: #495057;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

// 动画
@keyframes alertSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .warning-alert-container {
    width: 95%;
    max-height: 90vh;
  }
  
  .alert-header {
    padding: 12px 16px;
    margin: -16px -16px 16px -16px;
    
    .header-left {
      gap: 8px;
      
      .warning-icon {
        font-size: 20px;
      }
      
      .alert-title {
        font-size: 16px;
      }
    }
  }
  
  .alert-content {
    .warning-info .info-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      
      .label {
        min-width: auto;
        font-weight: 600;
      }
    }
  }
  
  .alert-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}
</style>