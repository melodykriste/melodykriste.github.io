<template>
  <div class="warning-settings">
    <div class="page-header">
      <h1>预警参数设置</h1>
      <p class="page-description">配置和管理各类预警规则，确保资金安全监管</p>
    </div>

    <el-alert 
      v-if="!canEditWarnings"
      title="权限提示" 
      type="warning" 
      :closable="false"
      class="permission-alert"
    >
      您当前没有修改预警配置的权限，仅可查看配置信息
    </el-alert>

    <div class="settings-content">
      <!-- 预警配置列表 -->
      <div class="warning-configs">
        <el-card 
          v-for="config in warningConfigs" 
          :key="config.id"
          class="warning-card"
          :class="{ 'enabled': config.enabled }"
        >
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <h3>{{ config.name }}</h3>
                <el-tag 
                  :type="config.level === 'high' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ config.level === 'high' ? '高风险' : '中风险' }}
                </el-tag>
              </div>
              <div class="header-right">
                <el-switch
                  v-model="config.enabled"
                  :disabled="!canEditWarnings || loading"
                  @change="handleToggleWarning(config.id, config.enabled)"
                />
              </div>
            </div>
          </template>

          <div class="card-content">
            <p class="description">{{ config.description }}</p>
            
            <!-- 动态配置组件 -->
            <component 
              :is="getConfigComponent(config.type)"
              :config="config"
              :disabled="!canEditWarnings || !config.enabled"
              @update="handleUpdateConfig"
            />

            <div class="config-actions" v-if="canEditWarnings && config.enabled">
              <el-button 
                type="primary" 
                size="small"
                @click="handleModifyConfig(config)"
              >
                修改配置
              </el-button>
              <el-button 
                type="success" 
                size="small"
                @click="handleTestConfig(config)"
              >
                测试规则
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="canEditWarnings">
        <el-card>
          <template #header>
            <h3>批量操作</h3>
          </template>
          <div class="batch-content">
            <el-button-group>
              <el-button @click="enableAllWarnings">启用所有预警</el-button>
              <el-button @click="disableAllWarnings">禁用所有预警</el-button>
              <el-button @click="resetToDefaults">恢复默认配置</el-button>
            </el-button-group>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 配置修改对话框 -->
    <el-dialog
      v-model="configDialogVisible"
      :title="`修改配置 - ${currentConfig?.name}`"
      width="60%"
      :close-on-click-modal="false"
    >
      <component 
        v-if="currentConfig"
        :is="getConfigComponent(currentConfig.type)"
        :config="currentConfig"
        :edit-mode="true"
        @update="handleConfigUpdate"
      />
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="configDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleSaveConfig"
            :loading="loading"
          >
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 加载状态 -->
    <el-loading 
      v-if="loading"
      element-loading-text="处理中..."
      element-loading-background="rgba(0, 0, 0, 0.7)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWarningStore } from '../stores/warningStore'
import type { WarningConfig, WarningType } from '../types/warning'

// 导入各种配置组件
import KeywordConfig from '../components/configs/KeywordConfig.vue'
import BlacklistConfig from '../components/configs/BlacklistConfig.vue'
import DuplicatePaymentConfig from '../components/configs/DuplicatePaymentConfig.vue'
import FrequentPaymentConfig from '../components/configs/FrequentPaymentConfig.vue'
import JudicialFreezeConfig from '../components/configs/JudicialFreezeConfig.vue'
import WageMisuseConfig from '../components/configs/WageMisuseConfig.vue'
import RelatedPartyConfig from '../components/configs/RelatedPartyConfig.vue'
import PaymentMisuseConfig from '../components/configs/PaymentMisuseConfig.vue'
import WageDelayAttendanceConfig from '../components/configs/WageDelayAttendanceConfig.vue'
import WageInconsistentConfig from '../components/configs/WageInconsistentConfig.vue'
import WageOverdueConfig from '../components/configs/WageOverdueConfig.vue'

const warningStore = useWarningStore()

// 响应式数据
const configDialogVisible = ref(false)
const currentConfig = ref<WarningConfig | null>(null)
const tempConfig = ref<WarningConfig | null>(null)

// 计算属性
const warningConfigs = computed(() => warningStore.warningConfigs)
const canEditWarnings = computed(() => warningStore.canEditWarnings)
const loading = computed(() => warningStore.loading)

// 获取配置组件
const getConfigComponent = (type: WarningType) => {
  const componentMap = {
    keyword: KeywordConfig,
    blacklist: BlacklistConfig,
    duplicatePayment: DuplicatePaymentConfig,
    frequentPayment: FrequentPaymentConfig,
    judicialFreeze: JudicialFreezeConfig,
    wageMisuse: WageMisuseConfig,
    relatedParty: RelatedPartyConfig,
    paymentMisuse: PaymentMisuseConfig,
    wageDelayAttendance: WageDelayAttendanceConfig,
    wageInconsistent: WageInconsistentConfig,
    wageOverdue: WageOverdueConfig
  }
  return componentMap[type] || 'div'
}

// 方法
const handleToggleWarning = async (warningId: string, enabled: boolean) => {
  try {
    await warningStore.toggleWarning(warningId, enabled)
    ElMessage.success(enabled ? '预警已启用' : '预警已禁用')
  } catch (error) {
    ElMessage.error('操作失败')
    console.error('Toggle warning failed:', error)
  }
}

const handleUpdateConfig = async (config: WarningConfig) => {
  try {
    await warningStore.updateWarningConfig(config)
    ElMessage.success('配置更新成功')
  } catch (error) {
    ElMessage.error('配置更新失败')
    console.error('Update config failed:', error)
  }
}

const handleModifyConfig = (config: WarningConfig) => {
  currentConfig.value = { ...config }
  tempConfig.value = { ...config }
  configDialogVisible.value = true
}

const handleConfigUpdate = (updatedConfig: WarningConfig) => {
  tempConfig.value = updatedConfig
}

const handleSaveConfig = async () => {
  if (!tempConfig.value) return
  
  try {
    await warningStore.updateWarningConfig(tempConfig.value)
    ElMessage.success('配置保存成功')
    configDialogVisible.value = false
    currentConfig.value = null
    tempConfig.value = null
  } catch (error) {
    ElMessage.error('配置保存失败')
    console.error('Save config failed:', error)
  }
}

const handleTestConfig = (config: WarningConfig) => {
  ElMessage.info('测试功能开发中...')
  // TODO: 实现测试配置功能
}

const enableAllWarnings = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      '确定要启用所有预警吗？',
      '批量操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmResult === 'confirm') {
      const promises = warningConfigs.value
        .filter(config => !config.enabled)
        .map(config => warningStore.toggleWarning(config.id, true))
      
      await Promise.all(promises)
      ElMessage.success('所有预警已启用')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量启用失败')
      console.error('Enable all warnings failed:', error)
    }
  }
}

const disableAllWarnings = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      '确定要禁用所有预警吗？',
      '批量操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmResult === 'confirm') {
      const promises = warningConfigs.value
        .filter(config => config.enabled)
        .map(config => warningStore.toggleWarning(config.id, false))
      
      await Promise.all(promises)
      ElMessage.success('所有预警已禁用')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量禁用失败')
      console.error('Disable all warnings failed:', error)
    }
  }
}

const resetToDefaults = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      '确定要恢复到默认配置吗？此操作将覆盖所有当前配置。',
      '恢复默认配置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (confirmResult === 'confirm') {
      warningStore.initializeDefaultConfigs()
      await warningStore.fetchWarningConfigs()
      ElMessage.success('已恢复默认配置')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('恢复默认配置失败')
      console.error('Reset to defaults failed:', error)
    }
  }
}

// 生命周期
onMounted(async () => {
  try {
    await warningStore.fetchWarningConfigs()
  } catch (error) {
    ElMessage.error('加载预警配置失败')
    console.error('Failed to load warning configs:', error)
  }
})
</script>

<style scoped lang="scss">
.warning-settings {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 24px;
    
    h1 {
      font-size: 28px;
      color: #303133;
      margin-bottom: 8px;
    }
    
    .page-description {
      color: #606266;
      font-size: 14px;
      margin: 0;
    }
  }

  .permission-alert {
    margin-bottom: 24px;
  }

  .settings-content {
    .warning-configs {
      display: grid;
      gap: 16px;
      margin-bottom: 24px;

      .warning-card {
        transition: all 0.3s ease;
        border: 2px solid #ebeef5;

        &.enabled {
          border-color: #67c23a;
          box-shadow: 0 2px 12px rgba(103, 194, 58, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .header-left {
            display: flex;
            align-items: center;
            gap: 12px;

            h3 {
              margin: 0;
              font-size: 16px;
              color: #303133;
            }
          }
        }

        .card-content {
          .description {
            color: #606266;
            font-size: 14px;
            margin-bottom: 16px;
            line-height: 1.5;
          }

          .config-actions {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #ebeef5;
            display: flex;
            gap: 8px;
          }
        }
      }
    }

    .batch-actions {
      .batch-content {
        display: flex;
        justify-content: center;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .warning-settings {
    padding: 16px;

    .page-header h1 {
      font-size: 24px;
    }

    .warning-configs .warning-card .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .batch-actions .batch-content {
      .el-button-group {
        display: flex;
        flex-direction: column;
        width: 100%;

        .el-button {
          border-radius: 4px !important;
          margin-bottom: 8px;
        }
      }
    }
  }
}
</style>