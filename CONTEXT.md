# Heimdall Server

Heimdall Server manages server-side authentication and account metadata for Heimdall users.

## Language

**Auth strategy**:
Login mechanism Heimdall supports, including local login, LDAP, OAuth/OIDC providers, and SAML.
_Avoid_: OAuth when referring to SAML or LDAP

**Creation method**:
Auth strategy that created a user account.
_Avoid_: Signup type, provider

## Relationships

- A **Creation method** is one **Auth strategy**.
- A user account has exactly one **Creation method**.

## Example dialogue

> **Dev:** "Should SAML appear in OAuth startup settings?"
> **Domain expert:** "No. SAML is an **Auth strategy**, but it is not OAuth."

## Flagged ambiguities

- "OAuth" was used to mean all external login mechanisms. Resolved: use **Auth strategy** for the broader concept.
