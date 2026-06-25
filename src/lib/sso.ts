// SSO / SCIM scaffold. Enterprise SSO (SAML / OIDC) and SCIM user provisioning
// require an external IdP (Okta, Entra ID, Google Workspace) and are configured at
// deploy time. This module is a deliberate placeholder seam: wire a provider here
// (e.g. BoxyHQ Jackson, WorkOS, or next-auth SAML) once an IdP is available.
export function ssoConfigured(): boolean {
  return Boolean(process.env.SSO_ISSUER && process.env.SSO_CLIENT_ID);
}

export const SSO_NOTE = "企业 SSO（SAML/OIDC）与 SCIM 自动开停号需对接外部身份提供商（Okta / Entra ID / Google Workspace），在部署时配置。";
