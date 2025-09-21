export interface UserCredentials {
  partner: string;
  partnerName: string;
  userId: string;
  role: 'PartnerUser' | 'PartnerAdmin' | 'InternalSupport';
}

// Using real partner IDs from the test environment
export const ORGANIZATIONS = [
  { value: '11111111-1111-1111-1111-111111111111', name: 'Acme Corporation' },
  { value: '22222222-2222-2222-2222-222222222222', name: 'Global Logistics Inc' },
  { value: '33333333-3333-3333-3333-333333333333', name: 'TechFlow Systems' },
  { value: '44444444-4444-4444-4444-444444444444', name: 'MegaTrade Ltd' },
  { value: '55555555-5555-5555-5555-555555555555', name: 'DataSync Partners' },
] as const;

export const USER_ROLES = [
  'PartnerUser',
  'PartnerAdmin', 
  'InternalSupport'
] as const;

export const TEST_USERS: UserCredentials[] = [
  // Acme Corporation (Primary test partner)
  { partner: '11111111-1111-1111-1111-111111111111', partnerName: 'Acme Corporation', userId: 'test-user@acme.com', role: 'PartnerUser' },
  { partner: '11111111-1111-1111-1111-111111111111', partnerName: 'Acme Corporation', userId: 'admin@acme.com', role: 'PartnerAdmin' },
  { partner: '11111111-1111-1111-1111-111111111111', partnerName: 'Acme Corporation', userId: 'support@acme.com', role: 'InternalSupport' },
  
  // Global Logistics Inc
  { partner: '22222222-2222-2222-2222-222222222222', partnerName: 'Global Logistics Inc', userId: 'user@globallogistics.com', role: 'PartnerUser' },
  { partner: '22222222-2222-2222-2222-222222222222', partnerName: 'Global Logistics Inc', userId: 'admin@globallogistics.com', role: 'PartnerAdmin' },
  { partner: '22222222-2222-2222-2222-222222222222', partnerName: 'Global Logistics Inc', userId: 'support@globallogistics.com', role: 'InternalSupport' },
  
  // TechFlow Systems
  { partner: '33333333-3333-3333-3333-333333333333', partnerName: 'TechFlow Systems', userId: 'user@techflow.com', role: 'PartnerUser' },
  { partner: '33333333-3333-3333-3333-333333333333', partnerName: 'TechFlow Systems', userId: 'admin@techflow.com', role: 'PartnerAdmin' },
  { partner: '33333333-3333-3333-3333-333333333333', partnerName: 'TechFlow Systems', userId: 'support@techflow.com', role: 'InternalSupport' },
  
  // MegaTrade Ltd
  { partner: '44444444-4444-4444-4444-444444444444', partnerName: 'MegaTrade Ltd', userId: 'user@megatrade.com', role: 'PartnerUser' },
  { partner: '44444444-4444-4444-4444-444444444444', partnerName: 'MegaTrade Ltd', userId: 'admin@megatrade.com', role: 'PartnerAdmin' },
  { partner: '44444444-4444-4444-4444-444444444444', partnerName: 'MegaTrade Ltd', userId: 'support@megatrade.com', role: 'InternalSupport' },
  
  // DataSync Partners (Suspended - for testing error scenarios)
  { partner: '55555555-5555-5555-5555-555555555555', partnerName: 'DataSync Partners', userId: 'user@datasync.com', role: 'PartnerUser' },
  { partner: '55555555-5555-5555-5555-555555555555', partnerName: 'DataSync Partners', userId: 'admin@datasync.com', role: 'PartnerAdmin' },
  { partner: '55555555-5555-5555-5555-555555555555', partnerName: 'DataSync Partners', userId: 'support@datasync.com', role: 'InternalSupport' },
];

export const INVALID_TEST_DATA = {
  emptyPartner: { partner: '', userId: 'test.user', role: 'PartnerUser' },
  emptyUserId: { partner: '11111111-1111-1111-1111-111111111111', userId: '', role: 'PartnerUser' },
  emptyRole: { partner: '11111111-1111-1111-1111-111111111111', userId: 'test.user', role: '' },
  allEmpty: { partner: '', userId: '', role: '' },
};

export function getUsersByRole(role: 'PartnerUser' | 'PartnerAdmin' | 'InternalSupport'): UserCredentials[] {
  return TEST_USERS.filter(user => user.role === role);
}

export function getUsersByOrganization(partner: string): UserCredentials[] {
  return TEST_USERS.filter(user => user.partner === partner);
}

export function getRandomUser(): UserCredentials {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

export function getRandomUserByRole(role: 'PartnerUser' | 'PartnerAdmin' | 'InternalSupport'): UserCredentials {
  const users = getUsersByRole(role);
  return users[Math.floor(Math.random() * users.length)];
}