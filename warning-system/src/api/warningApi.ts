import axios from 'axios'
import type { 
  WarningConfig, 
  WarningRecord, 
  WarningType, 
  WarningLevel 
} from '../types/warning'

// 创建axios实例
const api = axios.create({
  baseURL: '/api/warning',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    if (error.response?.status === 401) {
      // 处理未授权错误
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const warningApi = {
  // 获取所有预警配置
  async getConfigs(): Promise<WarningConfig[]> {
    return await api.get('/configs')
  },

  // 获取特定类型的预警配置
  async getConfigByType(type: WarningType): Promise<WarningConfig> {
    return await api.get(`/configs/${type}`)
  },

  // 更新预警配置
  async updateConfig(config: WarningConfig): Promise<WarningConfig> {
    return await api.put(`/configs/${config.id}`, config)
  },

  // 切换预警开关
  async toggleWarning(warningId: string, enabled: boolean): Promise<void> {
    return await api.patch(`/configs/${warningId}/toggle`, { enabled })
  },

  // 获取预警记录
  async getRecords(filters?: {
    level?: WarningLevel
    type?: WarningType
    processed?: boolean
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }): Promise<WarningRecord[]> {
    return await api.get('/records', { params: filters })
  },

  // 获取特定预警记录详情
  async getRecord(recordId: string): Promise<WarningRecord> {
    return await api.get(`/records/${recordId}`)
  },

  // 处理预警
  async processWarning(recordId: string, result: string): Promise<void> {
    return await api.post(`/records/${recordId}/process`, { result })
  },

  // 上传黑名单文件
  async uploadBlacklist(file: File): Promise<{
    filename: string
    data: Array<{ payeeName: string; accountNumber: string }>
  }> {
    const formData = new FormData()
    formData.append('file', file)
    
    return await api.post('/blacklist/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 下载黑名单模板
  async downloadBlacklistTemplate(): Promise<Blob> {
    const response = await api.get('/blacklist/template', {
      responseType: 'blob'
    })
    return response
  },

  // 获取当前黑名单
  async getCurrentBlacklist(): Promise<Array<{ payeeName: string; accountNumber: string }>> {
    return await api.get('/blacklist/current')
  },

  // 删除黑名单项
  async deleteBlacklistItem(payeeName: string, accountNumber: string): Promise<void> {
    return await api.delete('/blacklist/item', {
      data: { payeeName, accountNumber }
    })
  },

  // 添加黑名单项
  async addBlacklistItem(payeeName: string, accountNumber: string): Promise<void> {
    return await api.post('/blacklist/item', { payeeName, accountNumber })
  },

  // 触发预警检查（用于测试）
  async triggerWarningCheck(paymentData: any): Promise<WarningRecord[]> {
    return await api.post('/check', paymentData)
  },

  // 获取预警统计信息
  async getWarningStats(startDate?: string, endDate?: string): Promise<{
    total: number
    byLevel: Record<WarningLevel, number>
    byType: Record<WarningType, number>
    processed: number
    unprocessed: number
  }> {
    return await api.get('/stats', {
      params: { startDate, endDate }
    })
  },

  // 批量处理预警
  async batchProcessWarnings(recordIds: string[], result: string): Promise<void> {
    return await api.post('/records/batch-process', { recordIds, result })
  },

  // 导出预警记录
  async exportWarningRecords(filters?: {
    level?: WarningLevel
    type?: WarningType
    processed?: boolean
    startDate?: string
    endDate?: string
  }): Promise<Blob> {
    const response = await api.get('/records/export', {
      params: filters,
      responseType: 'blob'
    })
    return response
  },

  // 获取预警规则模板
  async getWarningRuleTemplates(): Promise<Record<WarningType, any>> {
    return await api.get('/rule-templates')
  },

  // 验证预警规则
  async validateWarningRule(type: WarningType, ruleData: any): Promise<{
    valid: boolean
    errors?: string[]
  }> {
    return await api.post('/validate-rule', { type, ruleData })
  }
}