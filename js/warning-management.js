/**
 * 预警管理系统 JavaScript
 * 包含预警规则引擎、配置管理、文件上传等功能
 */

class WarningManagementSystem {
    constructor() {
        this.warningConfigs = this.loadWarningConfigs();
        this.warningHistory = [];
        this.blacklist = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
        this.setupFileUpload();
        this.initializeCharts();
    }

    // 绑定事件
    bindEvents() {
        // 预警开关事件
        document.querySelectorAll('input[type="checkbox"][id$="WarningSwitch"]').forEach(switchEl => {
            switchEl.addEventListener('change', (e) => {
                this.handleWarningSwitch(e.target);
            });
        });

        // 保存配置按钮事件
        document.querySelectorAll('.btn-primary').forEach(btn => {
            if (btn.textContent.includes('保存配置')) {
                btn.addEventListener('click', (e) => {
                    this.saveWarningConfig(e.target);
                });
            }
        });

        // 文件上传相关事件
        this.setupFileUploadEvents();

        // 预警查看相关事件
        this.setupWarningViewEvents();

        // 导航切换事件
        this.setupNavigationEvents();
    }

    // 预警规则引擎
    checkWarnings(paymentData) {
        const warnings = [];
        
        // 检查各种预警类型
        if (this.warningConfigs.keyword.enabled) {
            const keywordWarning = this.checkKeywordWarning(paymentData);
            if (keywordWarning) warnings.push(keywordWarning);
        }

        if (this.warningConfigs.blacklist.enabled) {
            const blacklistWarning = this.checkBlacklistWarning(paymentData);
            if (blacklistWarning) warnings.push(blacklistWarning);
        }

        if (this.warningConfigs.duplicateAmount.enabled) {
            const duplicateAmountWarning = this.checkDuplicateAmountWarning(paymentData);
            if (duplicateAmountWarning) warnings.push(duplicateAmountWarning);
        }

        if (this.warningConfigs.duplicateFrequency.enabled) {
            const duplicateFrequencyWarning = this.checkDuplicateFrequencyWarning(paymentData);
            if (duplicateFrequencyWarning) warnings.push(duplicateFrequencyWarning);
        }

        if (this.warningConfigs.judicial.enabled) {
            const judicialWarning = this.checkJudicialWarning(paymentData);
            if (judicialWarning) warnings.push(judicialWarning);
        }

        if (this.warningConfigs.wageMisuse.enabled) {
            const wageMisuseWarning = this.checkWageMisuseWarning(paymentData);
            if (wageMisuseWarning) warnings.push(wageMisuseWarning);
        }

        if (this.warningConfigs.relatedParty.enabled) {
            const relatedPartyWarning = this.checkRelatedPartyWarning(paymentData);
            if (relatedPartyWarning) warnings.push(relatedPartyWarning);
        }

        if (this.warningConfigs.paymentMisuse.enabled) {
            const paymentMisuseWarning = this.checkPaymentMisuseWarning(paymentData);
            if (paymentMisuseWarning) warnings.push(paymentMisuseWarning);
        }

        if (this.warningConfigs.attendanceUnpaid.enabled) {
            const attendanceUnpaidWarning = this.checkAttendanceUnpaidWarning(paymentData);
            if (attendanceUnpaidWarning) warnings.push(attendanceUnpaidWarning);
        }

        if (this.warningConfigs.amountMismatch.enabled) {
            const amountMismatchWarning = this.checkAmountMismatchWarning(paymentData);
            if (amountMismatchWarning) warnings.push(amountMismatchWarning);
        }

        if (this.warningConfigs.overduePayment.enabled) {
            const overduePaymentWarning = this.checkOverduePaymentWarning(paymentData);
            if (overduePaymentWarning) warnings.push(overduePaymentWarning);
        }

        return warnings;
    }

    // 关键字预警检查
    checkKeywordWarning(paymentData) {
        const config = this.warningConfigs.keyword;
        const keywords = config.keywords.split(',').map(k => k.trim().toLowerCase());
        
        let matchedKeyword = null;
        let matchField = null;

        if (config.type === 'remark' || config.type === 'both') {
            const remark = (paymentData.remark || '').toLowerCase();
            const summary = (paymentData.summary || '').toLowerCase();
            
            for (const keyword of keywords) {
                if (remark.includes(keyword) || summary.includes(keyword)) {
                    matchedKeyword = keyword;
                    matchField = '备注/摘要';
                    break;
                }
            }
        }

        if (!matchedKeyword && (config.type === 'payee' || config.type === 'both')) {
            const payeeName = (paymentData.payeeName || '').toLowerCase();
            
            for (const keyword of keywords) {
                if (payeeName.includes(keyword)) {
                    matchedKeyword = keyword;
                    matchField = '收款单位';
                    break;
                }
            }
        }

        if (matchedKeyword) {
            return {
                type: 'keyword',
                level: config.level,
                action: config.action,
                message: `${matchField}中包含敏感关键字"${matchedKeyword}"`,
                details: {
                    keyword: matchedKeyword,
                    field: matchField,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 黑名单预警检查
    checkBlacklistWarning(paymentData) {
        const config = this.warningConfigs.blacklist;
        
        const isInBlacklist = this.blacklist.some(item => {
            return item.name === paymentData.payeeName || 
                   item.account === paymentData.payeeAccount;
        });

        if (isInBlacklist) {
            return {
                type: 'blacklist',
                level: config.level,
                action: config.action,
                message: '收款方在黑名单中',
                details: {
                    payeeName: paymentData.payeeName,
                    payeeAccount: paymentData.payeeAccount,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 重复性预警检查（收付款方金额相同）
    checkDuplicateAmountWarning(paymentData) {
        const config = this.warningConfigs.duplicateAmount;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // 查找本月内相同的支付记录
        const duplicates = this.warningHistory.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate.getMonth() === currentMonth &&
                   recordDate.getFullYear() === currentYear &&
                   record.payerAccount === paymentData.payerAccount &&
                   record.payeeAccount === paymentData.payeeAccount &&
                   record.amount === paymentData.amount &&
                   record.id !== paymentData.id;
        });

        if (duplicates.length > 0) {
            return {
                type: 'duplicateAmount',
                level: config.level,
                action: config.action,
                message: '月度内发生付款账户、收款账户以及金额相同的支付',
                details: {
                    duplicateCount: duplicates.length + 1,
                    duplicateRecords: duplicates,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 重复性预警检查（同一收款人频次）
    checkDuplicateFrequencyWarning(paymentData) {
        const config = this.warningConfigs.duplicateFrequency;
        const dayRange = config.dayRange || 30;
        const threshold = config.threshold || 3;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dayRange);

        // 统计指定天数内向同一收款人的付款次数
        const paymentCount = this.warningHistory.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= cutoffDate &&
                   record.payeeAccount === paymentData.payeeAccount &&
                   record.id !== paymentData.id;
        }).length + 1; // +1 包含当前支付

        if (paymentCount >= threshold) {
            return {
                type: 'duplicateFrequency',
                level: config.level,
                action: config.action,
                message: `${dayRange}日内向同一收款人付款超过${threshold}次`,
                details: {
                    paymentCount: paymentCount,
                    dayRange: dayRange,
                    threshold: threshold,
                    payeeName: paymentData.payeeName,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 司法冻结预警检查
    checkJudicialWarning(paymentData) {
        const config = this.warningConfigs.judicial;
        
        // 模拟检查监管账户是否有司法冻结或扣划记录
        // 实际应用中需要对接相关司法系统API
        const hasJudicialIssue = this.checkAccountJudicialStatus(paymentData.payerAccount);

        if (hasJudicialIssue) {
            return {
                type: 'judicial',
                level: config.level,
                action: config.action,
                message: '监管账户发生司法冻结或司法扣划',
                details: {
                    account: paymentData.payerAccount,
                    issueType: hasJudicialIssue.type,
                    issueDetails: hasJudicialIssue.details,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 资金挪用预警检查（农民工工资超平均数）
    checkWageMisuseWarning(paymentData) {
        const config = this.warningConfigs.wageMisuse;
        
        if (paymentData.paymentType !== 'wage') return null;

        const averageWage = this.calculateAverageWage(paymentData.projectId);
        const currentWage = paymentData.amount;
        const ratio = currentWage / averageWage;

        const mediumThreshold = config.mediumThreshold || 3;
        const highThreshold = config.highThreshold || 5;

        if (ratio > mediumThreshold) {
            const level = ratio > highThreshold ? 'high' : 'medium';
            
            return {
                type: 'wageMisuse',
                level: level,
                action: config.action,
                message: `农民工工资发放金额超过平均数${ratio.toFixed(1)}倍`,
                details: {
                    currentWage: currentWage,
                    averageWage: averageWage,
                    ratio: ratio,
                    threshold: ratio > highThreshold ? highThreshold : mediumThreshold,
                    workerName: paymentData.workerName,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 关联方预警检查
    checkRelatedPartyWarning(paymentData) {
        const config = this.warningConfigs.relatedParty;
        
        const isRelatedParty = this.checkRelatedPartyRelationship(
            paymentData.payerCompany, 
            paymentData.payeeName
        );

        if (isRelatedParty) {
            return {
                type: 'relatedParty',
                level: config.level,
                action: config.action,
                message: '施工单位向关联企业发起支付',
                details: {
                    payerCompany: paymentData.payerCompany,
                    payeeCompany: paymentData.payeeName,
                    relationshipType: isRelatedParty.type,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 代发支付混用预警检查
    checkPaymentMisuseWarning(paymentData) {
        const config = this.warningConfigs.paymentMisuse;
        
        // 检查是否在代发资金模块进行对公账户付款
        if (paymentData.module === 'wage_payment' && paymentData.accountType === 'corporate') {
            return {
                type: 'paymentMisuse',
                level: config.level,
                action: config.action,
                message: '在代发资金模块进行对公账户付款',
                details: {
                    module: paymentData.module,
                    accountType: paymentData.accountType,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 考勤未发工资预警检查
    checkAttendanceUnpaidWarning(paymentData) {
        const config = this.warningConfigs.attendanceUnpaid;
        
        // 检查农民工考勤记录但未发工资的情况
        const unpaidWorkers = this.findUnpaidWorkersWithAttendance();

        if (unpaidWorkers.length > 0) {
            return {
                type: 'attendanceUnpaid',
                level: config.level,
                action: 'view', // 此类预警只能查看，不能处置
                message: `有${unpaidWorkers.length}名农民工已有考勤但未发工资`,
                details: {
                    unpaidWorkers: unpaidWorkers,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 实发应发不一致预警检查
    checkAmountMismatchWarning(paymentData) {
        const config = this.warningConfigs.amountMismatch;
        
        if (paymentData.paymentType !== 'wage') return null;

        const expectedAmount = this.getExpectedWageAmount(
            paymentData.workerId, 
            paymentData.payPeriod
        );

        if (expectedAmount && Math.abs(expectedAmount - paymentData.amount) > 0.01) {
            return {
                type: 'amountMismatch',
                level: config.level,
                action: config.action,
                message: '实发金额与工资表应发金额不一致',
                details: {
                    expectedAmount: expectedAmount,
                    actualAmount: paymentData.amount,
                    difference: paymentData.amount - expectedAmount,
                    workerName: paymentData.workerName,
                    payPeriod: paymentData.payPeriod,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 超期未发工资预警检查
    checkOverduePaymentWarning(paymentData) {
        const config = this.warningConfigs.overduePayment;
        const overdueThreshold = config.overdueDays || 30;
        
        const overdueWorkers = this.findOverdueWorkers(overdueThreshold);

        if (overdueWorkers.length > 0) {
            return {
                type: 'overduePayment',
                level: config.level,
                action: 'view', // 此类预警只能查看
                message: `有${overdueWorkers.length}名农民工超期${overdueThreshold}天未发工资`,
                details: {
                    overdueWorkers: overdueWorkers,
                    overdueThreshold: overdueThreshold,
                    paymentData: paymentData
                },
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    // 处理预警
    processWarning(warning) {
        switch (warning.action) {
            case 'view':
                this.showWarningModal(warning);
                break;
            case 'reject':
                return this.rejectPayment(warning);
            case 'review':
                return this.submitForReview(warning);
        }
        return true;
    }

    // 显示预警弹窗
    showWarningModal(warning) {
        const modal = document.getElementById('warningModal');
        const modalTitle = modal.querySelector('#warningModalLabel');
        const warningMessage = modal.querySelector('#warningMessage');
        const warningType = modal.querySelector('#warningType');
        const warningLevel = modal.querySelector('#warningLevel');
        const relatedCompany = modal.querySelector('#relatedCompany');
        const warningTime = modal.querySelector('#warningTime');

        modalTitle.textContent = this.getWarningTypeDisplayName(warning.type);
        warningMessage.textContent = warning.message;
        warningType.textContent = this.getWarningTypeDisplayName(warning.type);
        warningLevel.textContent = warning.level === 'high' ? '高风险' : '中风险';
        warningLevel.className = `badge ${warning.level === 'high' ? 'bg-danger' : 'bg-warning'}`;
        relatedCompany.textContent = warning.details.paymentData?.payeeName || '未知';
        warningTime.textContent = new Date(warning.timestamp).toLocaleString('zh-CN');

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // 记录预警历史
        this.warningHistory.push(warning);
        this.saveWarningHistory();
    }

    // 拒绝支付
    rejectPayment(warning) {
        this.showMessage('支付已被拒绝：' + warning.message, 'error');
        this.warningHistory.push({...warning, status: 'rejected'});
        this.saveWarningHistory();
        return false;
    }

    // 提交业主审核
    submitForReview(warning) {
        this.showMessage('支付已提交业主审核：' + warning.message, 'info');
        this.warningHistory.push({...warning, status: 'pending_review'});
        this.saveWarningHistory();
        return 'review';
    }

    // 文件上传功能
    setupFileUpload() {
        const uploadArea = document.getElementById('blacklistUploadArea');
        const fileInput = document.getElementById('blacklistFileInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }
    }

    // 处理文件上传
    handleFileUpload(file) {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            this.showMessage('请上传Excel格式的文件', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // 这里应该使用专门的Excel解析库，如SheetJS
                // 为了演示，这里使用简化的处理
                this.parseBlacklistFile(e.target.result);
                this.showMessage('黑名单文件上传成功', 'success');
            } catch (error) {
                this.showMessage('文件解析失败：' + error.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // 解析黑名单文件
    parseBlacklistFile(arrayBuffer) {
        // 实际应用中需要使用SheetJS等库来解析Excel文件
        // 这里仅作示例
        const mockData = [
            { name: '违规公司A', account: '1234567890123456789' },
            { name: '违规公司B', account: '9876543210987654321' },
            { name: '违规公司C', account: '5555666677778888999' }
        ];
        
        this.blacklist = mockData;
        this.saveBlacklist();
    }

    // 下载黑名单模板
    downloadBlacklistTemplate() {
        const template = [
            ['收款方名称', '收款方账号', '备注'],
            ['示例公司', '1234567890123456789', '示例备注']
        ];

        const csvContent = template.map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', '黑名单模板.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 辅助方法
    getWarningTypeDisplayName(type) {
        const typeNames = {
            keyword: '关键字预警',
            blacklist: '黑名单预警',
            duplicateAmount: '重复性预警（金额）',
            duplicateFrequency: '重复性预警（频次）',
            judicial: '司法冻结预警',
            wageMisuse: '资金挪用预警（工资）',
            relatedParty: '关联方预警',
            paymentMisuse: '代发支付混用预警',
            attendanceUnpaid: '考勤未发工资预警',
            amountMismatch: '实发应发不一致预警',
            overduePayment: '超期未发工资预警'
        };
        return typeNames[type] || type;
    }

    // 显示消息提示
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 数据持久化方法
    loadWarningConfigs() {
        const saved = localStorage.getItem('warningConfigs');
        if (saved) {
            return JSON.parse(saved);
        }
        
        // 默认配置
        return {
            keyword: {
                enabled: true,
                type: 'remark',
                keywords: '现金,借款,个人',
                level: 'medium',
                action: 'view'
            },
            blacklist: {
                enabled: true,
                level: 'medium',
                action: 'reject'
            },
            duplicateAmount: {
                enabled: true,
                level: 'medium',
                action: 'view'
            },
            duplicateFrequency: {
                enabled: true,
                dayRange: 30,
                threshold: 3,
                level: 'medium',
                action: 'view'
            },
            judicial: {
                enabled: true,
                level: 'high',
                action: 'reject'
            },
            wageMisuse: {
                enabled: true,
                mediumThreshold: 3,
                highThreshold: 5,
                level: 'medium',
                action: 'review'
            },
            relatedParty: {
                enabled: true,
                level: 'medium',
                action: 'review'
            },
            paymentMisuse: {
                enabled: true,
                level: 'medium',
                action: 'reject'
            },
            attendanceUnpaid: {
                enabled: true,
                level: 'medium'
            },
            amountMismatch: {
                enabled: true,
                level: 'medium',
                action: 'review'
            },
            overduePayment: {
                enabled: true,
                overdueDays: 30,
                level: 'medium'
            }
        };
    }

    saveWarningConfigs() {
        localStorage.setItem('warningConfigs', JSON.stringify(this.warningConfigs));
    }

    saveWarningHistory() {
        localStorage.setItem('warningHistory', JSON.stringify(this.warningHistory));
    }

    saveBlacklist() {
        localStorage.setItem('blacklist', JSON.stringify(this.blacklist));
    }

    // 模拟数据方法（实际应用中应该调用后端API）
    checkAccountJudicialStatus(account) {
        // 模拟司法冻结检查
        const mockFrozenAccounts = ['1111222233334444555'];
        if (mockFrozenAccounts.includes(account)) {
            return {
                type: 'frozen',
                details: '账户被法院冻结'
            };
        }
        return null;
    }

    calculateAverageWage(projectId) {
        // 模拟计算平均工资
        return 5000;
    }

    checkRelatedPartyRelationship(company1, company2) {
        // 模拟关联方检查
        const mockRelatedParties = [
            { parent: '建筑集团A', subsidiary: '子公司A1' },
            { parent: '建筑集团B', subsidiary: '子公司B1' }
        ];
        
        const isRelated = mockRelatedParties.find(rel => 
            (rel.parent === company1 && rel.subsidiary === company2) ||
            (rel.parent === company2 && rel.subsidiary === company1)
        );
        
        return isRelated ? { type: 'parent_subsidiary' } : null;
    }

    findUnpaidWorkersWithAttendance() {
        // 模拟查找有考勤但未发工资的农民工
        return [
            { id: 1, name: '张三', lastAttendance: '2024-01-15', unpaidMonths: 2 },
            { id: 2, name: '李四', lastAttendance: '2024-01-10', unpaidMonths: 1 }
        ];
    }

    getExpectedWageAmount(workerId, payPeriod) {
        // 模拟获取工资表中的应发金额
        const mockWageData = {
            1: { '2024-01': 4500, '2024-02': 4800 },
            2: { '2024-01': 5200, '2024-02': 5100 }
        };
        
        return mockWageData[workerId]?.[payPeriod] || null;
    }

    findOverdueWorkers(days) {
        // 模拟查找超期未发工资的农民工
        return [
            { id: 3, name: '王五', entryDate: '2023-12-01', lastPayment: '2023-12-25' },
            { id: 4, name: '赵六', entryDate: '2023-11-15', lastPayment: '2023-12-20' }
        ];
    }

    // 初始化数据
    loadInitialData() {
        // 加载预警历史
        const savedHistory = localStorage.getItem('warningHistory');
        if (savedHistory) {
            this.warningHistory = JSON.parse(savedHistory);
        }

        // 加载黑名单
        const savedBlacklist = localStorage.getItem('blacklist');
        if (savedBlacklist) {
            this.blacklist = JSON.parse(savedBlacklist);
        }

        // 更新UI状态
        this.updateUIFromConfigs();
    }

    updateUIFromConfigs() {
        // 根据配置更新界面状态
        Object.keys(this.warningConfigs).forEach(key => {
            const config = this.warningConfigs[key];
            const switchEl = document.getElementById(`${key}WarningSwitch`);
            if (switchEl) {
                switchEl.checked = config.enabled;
                this.toggleConfigContent(switchEl);
            }
        });
    }

    handleWarningSwitch(switchEl) {
        const configKey = switchEl.id.replace('WarningSwitch', '');
        this.warningConfigs[configKey].enabled = switchEl.checked;
        this.saveWarningConfigs();
        this.toggleConfigContent(switchEl);
    }

    toggleConfigContent(switchEl) {
        const panel = switchEl.closest('.warning-config-panel');
        const content = panel.querySelector('.warning-config-content');
        if (content) {
            content.style.display = switchEl.checked ? 'block' : 'none';
        }
    }

    saveWarningConfig(button) {
        const panel = button.closest('.warning-config-panel');
        const configKey = this.getConfigKeyFromPanel(panel);
        
        if (configKey && this.warningConfigs[configKey]) {
            // 收集配置数据
            const formData = this.collectFormData(panel);
            
            // 更新配置
            Object.assign(this.warningConfigs[configKey], formData);
            
            // 保存配置
            this.saveWarningConfigs();
            
            // 显示成功消息
            this.showMessage('配置保存成功', 'success');
        }
    }

    getConfigKeyFromPanel(panel) {
        // 根据面板内容确定配置键
        const title = panel.querySelector('h5').textContent;
        const keyMap = {
            '关键字预警配置': 'keyword',
            '黑名单预警配置': 'blacklist',
            '重复性预警配置（收付款方金额相同）': 'duplicateAmount',
            '重复性预警配置（同一收款人频次）': 'duplicateFrequency',
            '司法冻结和扣划预警配置': 'judicial',
            '资金挪用预警配置（农民工工资超平均数）': 'wageMisuse',
            '关联方预警配置': 'relatedParty',
            '资金挪用预警配置（代发支付混用）': 'paymentMisuse',
            '拖欠农民工预警配置（已有考勤未发工资）': 'attendanceUnpaid',
            '拖欠农民工预警配置（实发应发不一致）': 'amountMismatch',
            '拖欠农民工预警配置（超期未发工资预警）': 'overduePayment'
        };
        
        return keyMap[title];
    }

    collectFormData(panel) {
        const formData = {};
        
        // 收集所有表单元素的值
        panel.querySelectorAll('input, select, textarea').forEach(element => {
            if (element.type === 'checkbox') {
                formData[element.name || element.id] = element.checked;
            } else if (element.type === 'number') {
                formData[element.name || element.id] = parseFloat(element.value) || 0;
            } else {
                formData[element.name || element.id] = element.value;
            }
        });
        
        return formData;
    }

    setupFileUploadEvents() {
        // 上传文件按钮
        document.querySelectorAll('.btn-outline-primary').forEach(btn => {
            if (btn.textContent.includes('上传文件')) {
                btn.addEventListener('click', () => {
                    document.getElementById('blacklistFileInput').click();
                });
            }
        });

        // 下载模板按钮
        document.querySelectorAll('.btn-outline-info').forEach(btn => {
            if (btn.textContent.includes('下载模板')) {
                btn.addEventListener('click', () => {
                    this.downloadBlacklistTemplate();
                });
            }
        });

        // 查看当前名单按钮
        document.querySelectorAll('.btn-outline-success').forEach(btn => {
            if (btn.textContent.includes('查看当前名单')) {
                btn.addEventListener('click', () => {
                    this.showCurrentBlacklist();
                });
            }
        });
    }

    showCurrentBlacklist() {
        if (this.blacklist.length === 0) {
            this.showMessage('当前黑名单为空', 'info');
            return;
        }

        let content = '<h6>当前黑名单：</h6><ul>';
        this.blacklist.forEach(item => {
            content += `<li>${item.name} - ${item.account}</li>`;
        });
        content += '</ul>';

        // 创建并显示模态框
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">当前黑名单</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${content}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    setupWarningViewEvents() {
        // 查询按钮事件
        const queryBtn = document.querySelector('#warning-view .btn-primary');
        if (queryBtn && queryBtn.textContent.includes('查询')) {
            queryBtn.addEventListener('click', () => {
                this.queryWarnings();
            });
        }

        // 查看详情和处理按钮事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-outline-primary') && 
                e.target.textContent.includes('查看详情')) {
                this.showWarningDetails(e.target);
            }
            
            if (e.target.classList.contains('btn-outline-success') && 
                e.target.textContent.includes('处理')) {
                this.handleWarningProcess(e.target);
            }
        });
    }

    queryWarnings() {
        // 获取筛选条件
        const filters = this.getWarningFilters();
        
        // 过滤预警数据
        const filteredWarnings = this.filterWarnings(filters);
        
        // 更新预警列表显示
        this.updateWarningList(filteredWarnings);
        
        this.showMessage('查询完成', 'success');
    }

    getWarningFilters() {
        const warningViewPanel = document.querySelector('#warning-view');
        const selects = warningViewPanel.querySelectorAll('select');
        
        return {
            type: selects[0].value,
            level: selects[1].value,
            status: selects[2].value
        };
    }

    filterWarnings(filters) {
        return this.warningHistory.filter(warning => {
            if (filters.type && warning.type !== filters.type) return false;
            if (filters.level && warning.level !== filters.level) return false;
            if (filters.status && warning.status !== filters.status) return false;
            return true;
        });
    }

    updateWarningList(warnings) {
        const tbody = document.querySelector('#warning-view tbody');
        tbody.innerHTML = '';
        
        warnings.forEach(warning => {
            const row = this.createWarningRow(warning);
            tbody.appendChild(row);
        });
    }

    createWarningRow(warning) {
        const row = document.createElement('tr');
        const statusText = this.getStatusText(warning.status);
        const statusClass = this.getStatusClass(warning.status);
        
        row.innerHTML = `
            <td>${new Date(warning.timestamp).toLocaleString('zh-CN')}</td>
            <td><span class="badge bg-primary">${this.getWarningTypeDisplayName(warning.type)}</span></td>
            <td><span class="badge ${warning.level === 'high' ? 'bg-danger' : 'bg-warning'}">${warning.level === 'high' ? '高风险' : '中风险'}</span></td>
            <td>${warning.message}</td>
            <td>${warning.details.paymentData?.payeeName || '未知'}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1">查看详情</button>
                ${warning.status === 'pending' ? '<button class="btn btn-sm btn-outline-success">处理</button>' : ''}
            </td>
        `;
        
        return row;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '待处理',
            'processed': '已处理',
            'ignored': '已忽略',
            'rejected': '已拒绝',
            'pending_review': '审核中'
        };
        return statusMap[status] || '未知';
    }

    getStatusClass(status) {
        const classMap = {
            'pending': 'bg-danger',
            'processed': 'bg-success',
            'ignored': 'bg-secondary',
            'rejected': 'bg-dark',
            'pending_review': 'bg-warning'
        };
        return classMap[status] || 'bg-secondary';
    }

    setupNavigationEvents() {
        // 侧边栏导航事件
        document.querySelectorAll('.list-group-item[data-bs-toggle="pill"]').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.target.getAttribute('href');
                if (target === '#warning-statistics') {
                    this.updateStatistics();
                }
            });
        });
    }

    updateStatistics() {
        // 更新统计数据
        const stats = this.calculateStatistics();
        
        // 更新统计卡片
        const statCards = document.querySelectorAll('#warning-statistics .card h2');
        if (statCards.length >= 4) {
            statCards[0].textContent = stats.total;
            statCards[1].textContent = stats.high;
            statCards[2].textContent = stats.medium;
            statCards[3].textContent = stats.processed;
        }
    }

    calculateStatistics() {
        const total = this.warningHistory.length;
        const high = this.warningHistory.filter(w => w.level === 'high').length;
        const medium = this.warningHistory.filter(w => w.level === 'medium').length;
        const processed = this.warningHistory.filter(w => w.status === 'processed').length;
        
        return { total, high, medium, processed };
    }

    initializeCharts() {
        // 图表初始化占位
        // 实际应用中可以使用Chart.js、ECharts等图表库
        console.log('Charts initialized');
    }

    showWarningDetails(button) {
        // 显示预警详情
        this.showMessage('预警详情功能待实现', 'info');
    }

    handleWarningProcess(button) {
        // 处理预警
        this.showMessage('预警处理功能待实现', 'info');
    }
}

// 初始化系统
document.addEventListener('DOMContentLoaded', () => {
    window.warningSystem = new WarningManagementSystem();
});

// 导出供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WarningManagementSystem;
}