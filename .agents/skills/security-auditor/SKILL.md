---
name: Security Auditor
description: Security auditing rules, checking for hardcoded private keys or secrets, safe handling of environment variables, and gas/network safety.
---

# Security Auditor Guidelines

These guidelines ensure key security policies are met during development, especially when working with Web3 and private keys:

## Secret Management
- **Never Hardcode Secrets**: Private keys, mnemonic phrases, and API credentials must NEVER be written as string literals in source code.
- **Environment Variables**: Use `.env.local` (or appropriate process environment configuration) to load keys dynamically.
- **Console Log Prevention**: Never print private keys, signers, or sensitive objects to standard out (`console.log`, `console.error`, etc.).
- **Git Safety**: Ensure that files containing secrets (like `.env`, `.env.local`, keys files) are explicitly listed in `.gitignore`.

## Web3 and Private Key Practices
- Verify signers are constructed directly from env-loaded secrets.
- Throw clean errors when credentials are missing or malformed rather than letting the application crash with stack traces that might leak internal environment details.
