import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  WarningConfig, 
  WarningRecord, 
  WarningType, 
  WarningLevel,
  ProcessingType,
  UserInfo,
  UserRole
} from '../types/warning'
import { warningApi } from '../api/warningApi'

export const useWarningStore = defineStore('warning', () => {
  // 状态
  const warningConfigs = ref<WarningConfig[]>([])
  const warningRecords = ref<WarningRecord[]>([])
  const currentUser = ref<UserInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const enabledWarnings = computed(() => 
    warningConfigs.value.filter(config => config.enabled)
  )

  const highRiskWarnings = computed(() =>
    warningRecords.value.filter(record => record.level === WarningLevel.HIGH)
  )

  const mediumRiskWarnings = computed(() =>
    warningRecords.value.filter(record => record.level === WarningLevel.MEDIUM)
  )

  const unprocessedWarnings = computed(() =>
    warningRecords.value.filter(record => !record.processed)
  )

  const canEditWarnings = computed(() => 
    currentUser.value?.role === UserRole.OWNER
  )

  // 操作方法
  const fetchWarningConfigs = async () => {
    try {
      loading.value = true
      error.value = null
      const configs = await warningApi.getConfigs()
      warningConfigs.value = configs
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取预警配置失败'
      console.error('Failed to fetch warning configs:', err)
    } finally {
      loading.value = false
    }
  }

  const updateWarningConfig = async (config: WarningConfig) => {
    try {
      loading.value = true
      error.value = null
      const updatedConfig = await warningApi.updateConfig(config)
      const index = warningConfigs.value.findIndex(c => c.id === config.id)
      if (index !== -1) {
        warningConfigs.value[index] = updatedConfig
      }
      return updatedConfig
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新预警配置失败'
      console.error('Failed to update warning config:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleWarning = async (warningId: string, enabled: boolean) => {
    try {
      loading.value = true
      error.value = null
      await warningApi.toggleWarning(warningId, enabled)
      const config = warningConfigs.value.find(c => c.id === warningId)
      if (config) {
        config.enabled = enabled
        config.updatedAt = new Date().toISOString()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换预警状态失败'
      console.error('Failed to toggle warning:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchWarningRecords = async (filters?: {
    level?: WarningLevel
    type?: WarningType
    processed?: boolean
    startDate?: string
    endDate?: string
  }) => {
    try {
      loading.value = true
      error.value = null
      const records = await warningApi.getRecords(filters)
      warningRecords.value = records
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取预警记录失败'
      console.error('Failed to fetch warning records:', err)
    } finally {
      loading.value = false
    }
  }

  const processWarning = async (recordId: string, result: string) => {
    try {
      loading.value = true
      error.value = null
      await warningApi.processWarning(recordId, result)
      const record = warningRecords.value.find(r => r.id === recordId)
      if (record) {
        record.processed = true
        record.processingResult = result
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '处理预警失败'
      console.error('Failed to process warning:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadBlacklist = async (file: File) => {
    try {
      loading.value = true
      error.value = null
      const result = await warningApi.uploadBlacklist(file)
      
      // 更新黑名单配置
      const blacklistConfig = warningConfigs.value.find(
        c => c.type === WarningType.BLACKLIST
      )
      if (blacklistConfig && 'blacklistData' in blacklistConfig) {
        blacklistConfig.blacklistData = result.data
        blacklistConfig.blacklistFile = result.filename
        blacklistConfig.updatedAt = new Date().toISOString()
      }
      
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传黑名单失败'
      console.error('Failed to upload blacklist:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentUser = (user: UserInfo) => {
    currentUser.value = user
  }

  const clearError = () => {
    error.value = null
  }

  const getWarningConfigByType = (type: WarningType) => {
    return warningConfigs.value.find(config => config.type === type)
  }

  const getWarningsByLevel = (level: WarningLevel) => {
    return warningRecords.value.filter(record => record.level === level)
  }

  const getWarningsByType = (type: WarningType) => {
    return warningRecords.value.filter(record => record.type === type)
  }

  // 初始化默认配置
  const initializeDefaultConfigs = () => {
    const defaultConfigs: Partial<WarningConfig>[] = [
      {
        type: WarningType.KEYWORD,
        name: '关键字预警',
        description: '根据收款关键字及备注或摘要关键字进行预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.BLACKLIST,
        name: '黑名单预警',
        description: '根据收款方黑名单进行预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.DUPLICATE_PAYMENT,
        name: '重复性预警（收付款方金额相同）',
        description: '月度内发生付款账户、收款账户以及金额相同的支付预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.FREQUENT_PAYMENT,
        name: '重复性预警（同一收款人多次付款）',
        description: '同一收款人30日内累计付款3次以上预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.JUDICIAL_FREEZE,
        name: '司法冻结和扣划预警',
        description: '监管账户发生司法冻结或司法扣划预警',
        enabled: false,
        level: WarningLevel.HIGH,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.WAGE_MISUSE,
        name: '资金挪用预警（农民工工资超平均数）',
        description: '农民工工资发放金额超过历史平均数预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.RELATED_PARTY,
        name: '关联方预警',
        description: '施工单位向关联企业发起支付预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.PAYMENT_MISUSE,
        name: '资金挪用预警（代发支付混用）',
        description: '代发资金模块进行对公账户付款预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.WAGE_DELAY_ATTENDANCE,
        name: '拖欠农民工预警（已有考勤未发工资）',
        description: '农民工已有考勤但未发放工资预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.WAGE_INCONSISTENT,
        name: '拖欠农民工预警（实发应发不一致）',
        description: '农民工实际代发金额与工资表应发金额不一致预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      },
      {
        type: WarningType.WAGE_OVERDUE,
        name: '拖欠农民工预警（超期未发工资预警）',
        description: '农民工超过进场时间未发工资预警',
        enabled: false,
        level: WarningLevel.MEDIUM,
        processingType: ProcessingType.VIEW_ONLY
      }
    ]

    // 这里应该调用API来初始化配置，这里仅作为示例
    console.log('Default configs initialized:', defaultConfigs)
  }

  return {
    // 状态
    warningConfigs,
    warningRecords,
    currentUser,
    loading,
    error,
    
    // 计算属性
    enabledWarnings,
    highRiskWarnings,
    mediumRiskWarnings,
    unprocessedWarnings,
    canEditWarnings,
    
    // 方法
    fetchWarningConfigs,
    updateWarningConfig,
    toggleWarning,
    fetchWarningRecords,
    processWarning,
    uploadBlacklist,
    setCurrentUser,
    clearError,
    getWarningConfigByType,
    getWarningsByLevel,
    getWarningsByType,
    initializeDefaultConfigs
  }
})