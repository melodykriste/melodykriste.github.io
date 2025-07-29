<template>
  <div class="warning-history">
    <div class="page-header">
      <h1>预警查看</h1>
      <p class="page-description">查看和管理系统预警记录，按风险等级筛选预警信息</p>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-card>
        <el-form 
          :model="filterForm" 
          inline 
          size="default"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="风险等级">
            <el-select 
              v-model="filterForm.level" 
              placeholder="选择风险等级"
              clearable
              style="width: 120px;"
            >
              <el-option label="中风险" value="medium" />
              <el-option label="高风险" value="high" />
            </el-select>
          </el-form-item>

          <el-form-item label="预警类型">
            <el-select 
              v-model="filterForm.type" 
              placeholder="选择预警类型"
              clearable
              style="width: 180px;"
            >
              <el-option 
                v-for="warningType in warningTypeOptions"
                :key="warningType.value"
                :label="warningType.label"
                :value="warningType.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="处理状态">
            <el-select 
              v-model="filterForm.processed" 
              placeholder="选择处理状态"
              clearable
              style="width: 120px;"
            >
              <el-option label="已处理" :value="true" />
              <el-option label="未处理" :value="false" />
            </el-select>
          </el-form-item>

          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 240px;"
            />
          </el-form-item>

          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleSearch"
              :loading="loading"
            >
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">总预警数</div>
            </div>
            <el-icon class="stat-icon total"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number high-risk">{{ stats.highRisk }}</div>
              <div class="stat-label">高风险</div>
            </div>
            <el-icon class="stat-icon high-risk"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number medium-risk">{{ stats.mediumRisk }}</div>
              <div class="stat-label">中风险</div>
            </div>
            <el-icon class="stat-icon medium-risk"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number unprocessed">{{ stats.unprocessed }}</div>
              <div class="stat-label">未处理</div>
            </div>
            <el-icon class="stat-icon unprocessed"><Clock /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预警列表 -->
    <div class="warning-list">
      <el-card>
        <template #header>
          <div class="list-header">
            <span>预警记录</span>
            <div class="header-actions">
              <el-button 
                type="success" 
                size="small"
                @click="handleExport"
                :loading="exporting"
              >
                <el-icon><Download /></el-icon>
                导出
              </el-button>
              <el-button 
                type="primary" 
                size="small"
                @click="handleBatchProcess"
                :disabled="selectedRecords.length === 0"
              >
                批量处理
              </el-button>
            </div>
          </div>
        </template>

        <el-table 
          :data="warningRecords" 
          v-loading="loading"
          @selection-change="handleSelectionChange"
          row-key="id"
        >
          <el-table-column 
            type="selection" 
            width="50"
            :selectable="row => !row.processed"
          />
          
          <el-table-column label="预警类型" width="140">
            <template #default="{ row }">
              <el-tag 
                :type="getWarningTypeTagType(row.type)"
                size="small"
              >
                {{ getWarningTypeName(row.type) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.level === 'high' ? 'danger' : 'warning'"
                size="small"
              >
                {{ row.level === 'high' ? '高风险' : '中风险' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="title" label="预警标题" min-width="200" />

          <el-table-column prop="message" label="预警信息" min-width="250" show-overflow-tooltip />

          <el-table-column label="触发时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.triggeredAt) }}
            </template>
          </el-table-column>

          <el-table-column label="处理状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.processed ? 'success' : 'info'"
                size="small"
              >
                {{ row.processed ? '已处理' : '未处理' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                text
                @click="handleViewDetail(row)"
              >
                查看详情
              </el-button>
              <el-button 
                v-if="!row.processed && canProcessWarnings"
                type="success" 
                size="small" 
                text
                @click="handleProcessSingle(row)"
              >
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`预警详情 - ${currentRecord?.title}`"
      width="70%"
      :close-on-click-modal="false"
    >
      <div v-if="currentRecord" class="warning-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预警类型">
            <el-tag :type="getWarningTypeTagType(currentRecord.type)">
              {{ getWarningTypeName(currentRecord.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="currentRecord.level === 'high' ? 'danger' : 'warning'">
              {{ currentRecord.level === 'high' ? '高风险' : '中风险' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="触发时间">
            {{ formatDateTime(currentRecord.triggeredAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="currentRecord.processed ? 'success' : 'info'">
              {{ currentRecord.processed ? '已处理' : '未处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警信息" :span="2">
            {{ currentRecord.message }}
          </el-descriptions-item>
          <el-descriptions-item label="详细信息" :span="2">
            <pre class="detail-json">{{ JSON.stringify(currentRecord.details, null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item 
            v-if="currentRecord.processed" 
            label="处理结果" 
            :span="2"
          >
            {{ currentRecord.processingResult }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="!currentRecord?.processed && canProcessWarnings"
            type="primary" 
            @click="handleProcessFromDetail"
          >
            处理预警
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 处理预警对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理预警"
      width="50%"
      :close-on-click-modal="false"
    >
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="处理结果" required>
          <el-input
            v-model="processForm.result"
            type="textarea"
            :rows="4"
            placeholder="请输入处理结果说明..."
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="processDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirmProcess"
            :loading="processing"
          >
            确认处理
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  RefreshLeft, 
  Warning, 
  Clock, 
  Download 
} from '@element-plus/icons-vue'
import { useWarningStore } from '../stores/warningStore'
import type { WarningRecord, WarningType, WarningLevel } from '../types/warning'
import dayjs from 'dayjs'

const warningStore = useWarningStore()

// 响应式数据
const filterForm = reactive({
  level: undefined as WarningLevel | undefined,
  type: undefined as WarningType | undefined,
  processed: undefined as boolean | undefined
})

const dateRange = ref<[string, string] | null>(null)
const selectedRecords = ref<WarningRecord[]>([])
const detailDialogVisible = ref(false)
const processDialogVisible = ref(false)
const currentRecord = ref<WarningRecord | null>(null)
const processingRecords = ref<WarningRecord[]>([])
const exporting = ref(false)
const processing = ref(false)

const processForm = reactive({
  result: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 计算属性
const loading = computed(() => warningStore.loading)
const warningRecords = computed(() => warningStore.warningRecords)
const canProcessWarnings = computed(() => warningStore.canEditWarnings)

const stats = computed(() => {
  const records = warningRecords.value
  return {
    total: records.length,
    highRisk: records.filter(r => r.level === 'high').length,
    mediumRisk: records.filter(r => r.level === 'medium').length,
    unprocessed: records.filter(r => !r.processed).length
  }
})

const warningTypeOptions = [
  { label: '关键字预警', value: 'keyword' },
  { label: '黑名单预警', value: 'blacklist' },
  { label: '重复性预警（收付款方金额相同）', value: 'duplicatePayment' },
  { label: '重复性预警（同一收款人多次付款）', value: 'frequentPayment' },
  { label: '司法冻结和扣划预警', value: 'judicialFreeze' },
  { label: '资金挪用预警（农民工工资超平均数）', value: 'wageMisuse' },
  { label: '关联方预警', value: 'relatedParty' },
  { label: '资金挪用预警（代发支付混用）', value: 'paymentMisuse' },
  { label: '拖欠农民工预警（已有考勤未发工资）', value: 'wageDelayAttendance' },
  { label: '拖欠农民工预警（实发应发不一致）', value: 'wageInconsistent' },
  { label: '拖欠农民工预警（超期未发工资预警）', value: 'wageOverdue' }
]

// 方法
const getWarningTypeName = (type: WarningType): string => {
  const option = warningTypeOptions.find(opt => opt.value === type)
  return option?.label || type
}

const getWarningTypeTagType = (type: WarningType): string => {
  const dangerTypes = ['judicialFreeze', 'wageMisuse', 'paymentMisuse']
  const warningTypes = ['blacklist', 'frequentPayment', 'wageInconsistent']
  
  if (dangerTypes.includes(type)) return 'danger'
  if (warningTypes.includes(type)) return 'warning'
  return 'info'
}

const formatDateTime = (dateTime: string): string => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm:ss')
}

const handleSearch = async () => {
  const filters: any = {
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  
  if (filterForm.level) filters.level = filterForm.level
  if (filterForm.type) filters.type = filterForm.type
  if (filterForm.processed !== undefined) filters.processed = filterForm.processed
  
  if (dateRange.value) {
    filters.startDate = dateRange.value[0]
    filters.endDate = dateRange.value[1]
  }
  
  try {
    await warningStore.fetchWarningRecords(filters)
  } catch (error) {
    ElMessage.error('获取预警记录失败')
    console.error('Failed to fetch warning records:', error)
  }
}

const handleReset = () => {
  filterForm.level = undefined
  filterForm.type = undefined
  filterForm.processed = undefined
  dateRange.value = null
  pagination.page = 1
  handleSearch()
}

const handleSelectionChange = (selection: WarningRecord[]) => {
  selectedRecords.value = selection
}

const handleViewDetail = (record: WarningRecord) => {
  currentRecord.value = record
  detailDialogVisible.value = true
}

const handleProcessSingle = (record: WarningRecord) => {
  processingRecords.value = [record]
  processForm.result = ''
  processDialogVisible.value = true
}

const handleProcessFromDetail = () => {
  if (currentRecord.value) {
    processingRecords.value = [currentRecord.value]
    processForm.result = ''
    processDialogVisible.value = true
    detailDialogVisible.value = false
  }
}

const handleBatchProcess = () => {
  processingRecords.value = [...selectedRecords.value]
  processForm.result = ''
  processDialogVisible.value = true
}

const handleConfirmProcess = async () => {
  if (!processForm.result.trim()) {
    ElMessage.warning('请输入处理结果')
    return
  }
  
  try {
    processing.value = true
    
    if (processingRecords.value.length === 1) {
      await warningStore.processWarning(processingRecords.value[0].id, processForm.result)
    } else {
      // 批量处理
      const recordIds = processingRecords.value.map(r => r.id)
      // 这里应该调用批量处理API，暂时逐个处理
      for (const recordId of recordIds) {
        await warningStore.processWarning(recordId, processForm.result)
      }
    }
    
    ElMessage.success('预警处理成功')
    processDialogVisible.value = false
    selectedRecords.value = []
    
    // 刷新数据
    await handleSearch()
  } catch (error) {
    ElMessage.error('处理预警失败')
    console.error('Failed to process warning:', error)
  } finally {
    processing.value = false
  }
}

const handleExport = async () => {
  try {
    exporting.value = true
    
    const filters: any = {}
    if (filterForm.level) filters.level = filterForm.level
    if (filterForm.type) filters.type = filterForm.type
    if (filterForm.processed !== undefined) filters.processed = filterForm.processed
    if (dateRange.value) {
      filters.startDate = dateRange.value[0]
      filters.endDate = dateRange.value[1]
    }
    
    // 这里应该调用导出API
    ElMessage.success('导出功能开发中...')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('Failed to export:', error)
  } finally {
    exporting.value = false
  }
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  handleSearch()
}

// 监听筛选条件变化
watch([() => filterForm.level, () => filterForm.type, () => filterForm.processed], () => {
  pagination.page = 1
  handleSearch()
})

// 生命周期
onMounted(async () => {
  await handleSearch()
})
</script>

<style scoped lang="scss">
.warning-history {
  padding: 24px;
  max-width: 1400px;
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

  .filter-section {
    margin-bottom: 24px;
  }

  .stats-section {
    margin-bottom: 24px;
    
    .stat-card {
      position: relative;
      overflow: hidden;
      
      .stat-content {
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
          
          &.high-risk {
            color: #f56c6c;
          }
          
          &.medium-risk {
            color: #e6a23c;
          }
          
          &.unprocessed {
            color: #409eff;
          }
        }
        
        .stat-label {
          font-size: 14px;
          color: #606266;
        }
      }
      
      .stat-icon {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 48px;
        opacity: 0.1;
        
        &.total {
          color: #303133;
        }
        
        &.high-risk {
          color: #f56c6c;
        }
        
        &.medium-risk {
          color: #e6a23c;
        }
        
        &.unprocessed {
          color: #409eff;
        }
      }
    }
  }

  .warning-list {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  }

  .warning-detail {
    .detail-json {
      background-color: #f5f7fa;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;
      max-height: 200px;
      overflow-y: auto;
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
  .warning-history {
    padding: 16px;

    .page-header h1 {
      font-size: 24px;
    }

    .stats-section {
      .el-col {
        margin-bottom: 16px;
      }
    }

    .warning-list .list-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
}
</style>