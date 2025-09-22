// Core DTOs for the Trading Partner Portal
// All interfaces mirror backend DTOs with camelCase naming

export interface KeySummaryDto {
  keyId: string;
  fingerprint: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
  validFrom: string;
  validTo?: string | null;
  status: 'PendingActivation' | 'Active' | 'Revoked' | 'Expired' | 'Superseded';
  isPrimary: boolean;
}

export interface UploadKeyRequest {
  publicKeyArmored: string;
  validFrom?: string;
  validTo?: string;
  makePrimary?: boolean;
}

export interface GenerateKeyRequest {
  validFrom?: string;
  validTo?: string;
  makePrimary?: boolean;
}

export interface GenerateKeyResponse {
  privateKeyArmored: string;
  key: KeySummaryDto;
}

export interface RevokeKeyRequest {
  reason?: string;
}

export interface SftpCredentialMetadataDto {
  lastRotatedAt?: string | null;
  rotationMethod?: string | null;
}

export interface RotatePasswordRequest {
  mode: 'manual' | 'auto';
  newPassword?: string;
}

export interface RotatePasswordResponse {
  password?: string;
  metadata: SftpCredentialMetadataDto;
}

export interface DashboardSummaryDto {
  inboundFiles24h: number;
  outboundFiles24h: number;
  successRatePct: number;
  avgProcessingMs24h?: number | null;
  openErrors: number;
  totalBytes24h: number;
  avgFileSizeBytes24h?: number | null;
  connectionSuccessRate24h: number;
  largeFileCount24h: number;
}

export interface TimeSeriesPointDto {
  timestamp: string;
  inboundCount: number;
  outboundCount: number;
}

export interface TimeSeriesResponse {
  points: TimeSeriesPointDto[];
}

export interface ErrorCategoryDto {
  category: string;
  count: number;
}

export interface TopErrorsResponse {
  categories: ErrorCategoryDto[];
}

export interface FileEventListItemDto {
  fileId: string;
  direction: 'Inbound' | 'Outbound';
  docType: string;
  sizeBytes: number;
  receivedAt: string;
  processedAt?: string | null;
  status: 'Pending' | 'Processing' | 'Success' | 'Failed';
  errorCode?: string | null;
}

export interface FileEventDetailDto extends FileEventListItemDto {
  partnerId: string;
  correlationId: string;
  errorMessage?: string | null;
  retryCount: number;
  processingLatencyMs?: number | null;
}

export interface AuditEventDto {
  auditId: string;
  partnerId: string;
  actorUserId: string;
  actorRole: string;
  operationType: 'KeyUpload' | 'KeyGenerate' | 'KeyRevoke' | 'KeyDownload' | 'SftpPasswordChange';
  timestamp: string;
  success: boolean;
  metadata?: any;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    traceId: string;
  };
}

// Advanced metrics DTOs
export interface ConnectionHealthPointDto {
  timestamp: string;
  success: number;
  failed: number;
  authFailed: number;
  successRatePct: number;
}

export interface ConnectionCurrentStatusDto {
  partnerId: string;
  status: string;
  lastCheck: string;
}

export interface ThroughputPointDto {
  timestamp: string;
  totalBytes: number;
  fileCount: number;
  avgFileSizeBytes: number;
}

export interface LargeFileDto {
  fileName: string;
  sizeBytes: number;
  receivedAt: string;
}

export interface ConnectionPerformancePointDto {
  timestamp: string;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  count: number;
}

export interface DailyOpsPointDto {
  date: string;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  successRatePct: number;
}

export interface FailureBurstPointDto {
  windowStart: string;
  failureCount: number;
}

export interface ZeroFileWindowStatusDto {
  windowHours: number;
  inboundFiles: number;
  flagged: boolean;
}

// Search parameter interfaces
export interface FileSearchParams {
  page?: number;
  pageSize?: number;
  direction?: string;
  status?: string;
  docType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditSearchParams {
  page?: number;
  pageSize?: number;
  partnerId?: string;
  operationType?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Session and authentication models
export interface LoginRequest {
  partner: string;
  userId: string;
  role: 'PartnerUser' | 'PartnerAdmin' | 'InternalSupport';
}

export interface LoginResponse {
  token: string;
  user: {
    partnerId: string;
    userId: string;
    role: string;
  };
}

export interface SessionUser {
  partnerId: string;
  userId: string;
  role: string;
}

// System info
export interface VersionInfo {
  version: string;
  commit: string;
  buildTime: string;
}

export interface HealthStatus {
  status: string;
}

// SSE event types
export interface SseEvent {
  type: 'connection' | 'file.created' | 'file.statusChanged' | 'key.promoted' | 'key.revoked' | 'dashboard.metricsTick' | 
        'sftp.connectionStatusChanged' | 'sftp.failureBurstAlert' | 'sftp.zeroFileWindowAlert' | 'throughput.tick';
  data: any;
  id?: string;
}

// Error handling
export interface PortalError {
  code: string;
  message: string;
  traceId?: string;
  userMessage?: string;
}