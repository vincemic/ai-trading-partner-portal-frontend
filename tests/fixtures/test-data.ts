export interface UserCredentials {
  partner: string;
  partnerName: string;
  userId: string;
  role: 'PartnerUser' | 'PartnerAdmin' | 'InternalSupport';
}

export const ORGANIZATIONS = [
  { value: 'acme-healthcare', name: 'Acme Healthcare' },
  { value: 'metro-medical', name: 'Metro Medical Group' },
  { value: 'riverside-health', name: 'Riverside Health System' },
  { value: 'summit-care', name: 'Summit Care Partners' },
  { value: 'coastal-medical', name: 'Coastal Medical Center' },
] as const;

export const USER_ROLES = [
  'PartnerUser',
  'PartnerAdmin', 
  'InternalSupport'
] as const;

export const TEST_USERS: UserCredentials[] = [
  // Acme Healthcare
  { partner: 'acme-healthcare', partnerName: 'Acme Healthcare', userId: 'john.doe', role: 'PartnerUser' },
  { partner: 'acme-healthcare', partnerName: 'Acme Healthcare', userId: 'jane.admin', role: 'PartnerAdmin' },
  { partner: 'acme-healthcare', partnerName: 'Acme Healthcare', userId: 'support.user', role: 'InternalSupport' },
  
  // Metro Medical Group
  { partner: 'metro-medical', partnerName: 'Metro Medical Group', userId: 'mike.jones', role: 'PartnerUser' },
  { partner: 'metro-medical', partnerName: 'Metro Medical Group', userId: 'sarah.admin', role: 'PartnerAdmin' },
  { partner: 'metro-medical', partnerName: 'Metro Medical Group', userId: 'tech.support', role: 'InternalSupport' },
  
  // Riverside Health System
  { partner: 'riverside-health', partnerName: 'Riverside Health System', userId: 'bob.smith', role: 'PartnerUser' },
  { partner: 'riverside-health', partnerName: 'Riverside Health System', userId: 'alice.manager', role: 'PartnerAdmin' },
  { partner: 'riverside-health', partnerName: 'Riverside Health System', userId: 'system.admin', role: 'InternalSupport' },
  
  // Summit Care Partners
  { partner: 'summit-care', partnerName: 'Summit Care Partners', userId: 'david.wilson', role: 'PartnerUser' },
  { partner: 'summit-care', partnerName: 'Summit Care Partners', userId: 'emma.lead', role: 'PartnerAdmin' },
  { partner: 'summit-care', partnerName: 'Summit Care Partners', userId: 'ops.support', role: 'InternalSupport' },
  
  // Coastal Medical Center
  { partner: 'coastal-medical', partnerName: 'Coastal Medical Center', userId: 'lisa.brown', role: 'PartnerUser' },
  { partner: 'coastal-medical', partnerName: 'Coastal Medical Center', userId: 'tom.supervisor', role: 'PartnerAdmin' },
  { partner: 'coastal-medical', partnerName: 'Coastal Medical Center', userId: 'help.desk', role: 'InternalSupport' },
];

export const INVALID_TEST_DATA = {
  emptyPartner: { partner: '', userId: 'test.user', role: 'PartnerUser' },
  emptyUserId: { partner: 'acme-healthcare', userId: '', role: 'PartnerUser' },
  emptyRole: { partner: 'acme-healthcare', userId: 'test.user', role: '' },
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