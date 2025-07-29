// 预警风险等级
export enum WarningLevel {
  MEDIUM = 'medium', // 中风险
  HIGH = 'high'      // 高风险
}

// 处置方式
export enum ProcessingType {
  VIEW_ONLY = 'viewOnly',      // 仅查看
  DIRECT_REJECT = 'directReject', // 直接拒绝
  OWNER_REVIEW = 'ownerReview'    // 业主审核
}

// 预警类型
export enum WarningType {
  KEYWORD = 'keyword',                    // 关键字预警
  BLACKLIST = 'blacklist',               // 黑名单预警
  DUPLICATE_PAYMENT = 'duplicatePayment', // 重复性预警（收付款方金额相同）
  FREQUENT_PAYMENT = 'frequentPayment',   // 重复性预警（同一收款人多次付款）
  JUDICIAL_FREEZE = 'judicialFreeze',     // 司法冻结和扣划预警
  WAGE_MISUSE = 'wageMisuse',            // 资金挪用预警（农民工工资超平均数）
  RELATED_PARTY = 'relatedParty',        // 关联方预警
  PAYMENT_MISUSE = 'paymentMisuse',      // 资金挪用预警（代发支付混用）
  WAGE_DELAY_ATTENDANCE = 'wageDelayAttendance', // 拖欠农民工预警（已有考勤未发工资）
  WAGE_INCONSISTENT = 'wageInconsistent', // 拖欠农民工预警（实发应发不一致）
  WAGE_OVERDUE = 'wageOverdue'           // 拖欠农民工预警（超期未发工资预警）
}

// 关键字类型
export enum KeywordType {
  REMARK = 'remark',     // 备注/摘要关键字
  PAYEE = 'payee'        // 收款单位关键字
}

// 基础预警配置接口
export interface BaseWarningConfig {
  id: string;
  type: WarningType;
  name: string;
  description: string;
  enabled: boolean;
  level: WarningLevel;
  processingType: ProcessingType;
  createdAt: string;
  updatedAt: string;
}

// 关键字预警配置
export interface KeywordWarningConfig extends BaseWarningConfig {
  type: WarningType.KEYWORD;
  keywordType: KeywordType;
  keywords: string[];
}

// 黑名单预警配置
export interface BlacklistWarningConfig extends BaseWarningConfig {
  type: WarningType.BLACKLIST;
  blacklistFile?: string;
  blacklistData: Array<{
    payeeName: string;
    accountNumber: string;
  }>;
}

// 重复性预警配置（收付款方金额相同）
export interface DuplicatePaymentWarningConfig extends BaseWarningConfig {
  type: WarningType.DUPLICATE_PAYMENT;
  // 月度内检查
  checkPeriodDays: number;
}

// 重复性预警配置（同一收款人多次付款）
export interface FrequentPaymentWarningConfig extends BaseWarningConfig {
  type: WarningType.FREQUENT_PAYMENT;
  days: number;      // a日内
  times: number;     // b次以上
}

// 司法冻结和扣划预警配置
export interface JudicialFreezeWarningConfig extends BaseWarningConfig {
  type: WarningType.JUDICIAL_FREEZE;
  // 默认高风险，无额外参数
}

// 资金挪用预警配置（农民工工资超平均数）
export interface WageMisuseWarningConfig extends BaseWarningConfig {
  type: WarningType.WAGE_MISUSE;
  multiplierA: number; // a倍
  multiplierB: number; // b倍
}

// 关联方预警配置
export interface RelatedPartyWarningConfig extends BaseWarningConfig {
  type: WarningType.RELATED_PARTY;
  // 无额外参数
}

// 资金挪用预警配置（代发支付混用）
export interface PaymentMisuseWarningConfig extends BaseWarningConfig {
  type: WarningType.PAYMENT_MISUSE;
  // 无额外参数
}

// 拖欠农民工预警配置（已有考勤未发工资）
export interface WageDelayAttendanceWarningConfig extends BaseWarningConfig {
  type: WarningType.WAGE_DELAY_ATTENDANCE;
  // 考勤当月及次月均未发放工资，第三个月触发
}

// 拖欠农民工预警配置（实发应发不一致）
export interface WageInconsistentWarningConfig extends BaseWarningConfig {
  type: WarningType.WAGE_INCONSISTENT;
  // 无额外参数
}

// 拖欠农民工预警配置（超期未发工资）
export interface WageOverdueWarningConfig extends BaseWarningConfig {
  type: WarningType.WAGE_OVERDUE;
  days: number; // n个自然日
}

// 联合类型
export type WarningConfig = 
  | KeywordWarningConfig
  | BlacklistWarningConfig
  | DuplicatePaymentWarningConfig
  | FrequentPaymentWarningConfig
  | JudicialFreezeWarningConfig
  | WageMisuseWarningConfig
  | RelatedPartyWarningConfig
  | PaymentMisuseWarningConfig
  | WageDelayAttendanceWarningConfig
  | WageInconsistentWarningConfig
  | WageOverdueWarningConfig;

// 预警记录
export interface WarningRecord {
  id: string;
  type: WarningType;
  level: WarningLevel;
  title: string;
  message: string;
  details: any;
  triggeredAt: string;
  processed: boolean;
  processingType: ProcessingType;
  processingResult?: string;
  relatedPaymentId?: string;
  relatedAccountId?: string;
}

// 用户角色
export enum UserRole {
  OWNER = 'owner',           // 业主单位
  CONTRACTOR = 'contractor', // 施工单位
  REVIEWER = 'reviewer'      // 复核员
}

// 用户信息
export interface UserInfo {
  id: string;
  name: string;
  role: UserRole;
  permissions: string[];
}