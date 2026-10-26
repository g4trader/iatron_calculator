import assert from 'node:assert/strict';
import { test } from 'node:test';
import { communityConfigSchema, communityDefaults, communitySettingsInput, whatsappInvite } from '../lib/mentory/community-validation';
const invite = 'https://chat.whatsapp.com/TestInvitationCode12345';
test('community accepts only WhatsApp invitations and removes optional tracking', () => {
  assert.equal(whatsappInvite(invite + '?mode=ac_t'), invite);
  for (const url of ['javascript:alert(1)', 'http://chat.whatsapp.com/TestInvitationCode12345', 'https://chat.whatsapp.com.evil.test/TestInvitationCode12345', 'https://user:pass@chat.whatsapp.com/TestInvitationCode12345', invite + '#fragment', invite + '?redirect=https://evil.test', 'https://chat.whatsapp.com:444/TestInvitationCode12345', 'https://chat.whatsapp.com/%2fsecret', 'https://wa.me/15555550123']) assert.equal(whatsappInvite(url), null);
});
test('community is disabled by default and cannot activate without a valid invitation', () => {
  assert.equal(communityDefaults.enabled, false);
  assert.equal(communityConfigSchema.safeParse(communityDefaults).success, true);
  assert.equal(communityConfigSchema.safeParse({ ...communityDefaults, enabled: true }).success, false);
  assert.equal(communityConfigSchema.safeParse({ ...communityDefaults, enabled: true, inviteUrl: invite }).success, true);
});
test('community input rejects injected access sources, invalid support contacts and missing revisions', () => {
  for (const supportPhone of ['+5511999999999', '123', 'javascript:alert(1)', '055555555555', '15555550123?text=spam']) assert.equal(communityConfigSchema.safeParse({ ...communityDefaults, supportPhone }).success, false);
  assert.equal(communitySettingsInput.safeParse({ config: { ...communityDefaults, supportPhone: '15555550123' }, version: null }).success, true);
  assert.equal(communitySettingsInput.safeParse({ config: communityDefaults }).success, false);
  assert.equal(communitySettingsInput.safeParse({ config: communityDefaults, version: 'bad' }).success, false);
  assert.equal(communitySettingsInput.safeParse({ config: communityDefaults, version: null, userId: 'another' }).success, false);
  assert.equal(communityConfigSchema.safeParse({ ...communityDefaults, standaloneAccess: true }).success, false);
});
