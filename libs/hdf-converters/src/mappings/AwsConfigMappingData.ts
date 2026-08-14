// AWS Config managed rule to NIST SP 800-53 mappings.
//
// Sources, in precedence order; a row's controls come from exactly one:
//   1. AWS Config "Operational Best Practices for NIST 800-53" (Rev 4 and Rev 5)
//   2. Security Hub's NIST 800-53 r5 standard control pages (Rev 5 only)
//   3. A rule whose name matches a strong theme (encryption/TLS/logging/public
//      access) inherits the NIST core AWS assigned to >=75% of the same-theme
//      rules it did map. Never invents a control, only reuses one.
// Rules AWS maps for only one revision get the other revision cross-filled from
// the NIST catalogs: a control is kept when that revision defines it, otherwise
// it widens to its base control, and is dropped when the revision has no such
// control. Rev 4 statement letters (AC-2(j)) do not survive to Rev 5, which
// renumbered control statements.
//
// Row order is load-bearing: rules are alphabetical, and within a rule Rev 5
// comes first and Rev 4 last. AwsConfigMapping keys its lookup by rule name and
// source identifier with last-write-wins, so Rev 4 is what searchNIST resolves
// to. Reordering the revisions silently switches every lookup to Rev 5.
export const data = [
  {
    AwsConfigRuleSourceIdentifier: 'ACCESS_KEYS_ROTATED',
    AwsConfigRuleName: 'access-keys-rotated',
    'NIST-ID': 'AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACCESS_KEYS_ROTATED',
    AwsConfigRuleName: 'access-keys-rotated',
    'NIST-ID': 'AC-2(1)|AC-2(j)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACCOUNT_PART_OF_ORGANIZATIONS',
    AwsConfigRuleName: 'account-part-of-organizations',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACCOUNT_PART_OF_ORGANIZATIONS',
    AwsConfigRuleName: 'account-part-of-organizations',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACM_CERTIFICATE_EXPIRATION_CHECK',
    AwsConfigRuleName: 'acm-certificate-expiration-check',
    'NIST-ID': 'SC-7(16)|SC-28(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACM_CERTIFICATE_EXPIRATION_CHECK',
    AwsConfigRuleName: 'acm-certificate-expiration-check',
    'NIST-ID': 'AC-4|AC-17(2)|SC-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACM_PCA_ROOT_CA_DISABLED',
    AwsConfigRuleName: 'acm-pca-root-ca-disabled',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACM_PCA_ROOT_CA_DISABLED',
    AwsConfigRuleName: 'acm-pca-root-ca-disabled',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_DESYNC_MODE_CHECK',
    AwsConfigRuleName: 'alb-desync-mode-check',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_DESYNC_MODE_CHECK',
    AwsConfigRuleName: 'alb-desync-mode-check',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_HTTP_DROP_INVALID_HEADER_ENABLED',
    AwsConfigRuleName: 'alb-http-drop-invalid-header-enabled',
    'NIST-ID': 'SC-7(4)|SC-8(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_HTTP_DROP_INVALID_HEADER_ENABLED',
    AwsConfigRuleName: 'alb-http-drop-invalid-header-enabled',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_HTTP_TO_HTTPS_REDIRECTION_CHECK',
    AwsConfigRuleName: 'alb-http-to-https-redirection-check',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_HTTP_TO_HTTPS_REDIRECTION_CHECK',
    AwsConfigRuleName: 'alb-http-to-https-redirection-check',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_WAF_ENABLED',
    AwsConfigRuleName: 'alb-waf-enabled',
    'NIST-ID': 'AC-4(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_WAF_ENABLED',
    AwsConfigRuleName: 'alb-waf-enabled',
    'NIST-ID': 'SC-7|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_ASSOCIATED_WITH_WAF',
    AwsConfigRuleName: 'api-gw-associated-with-waf',
    'NIST-ID': 'AC-4(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_ASSOCIATED_WITH_WAF',
    AwsConfigRuleName: 'api-gw-associated-with-waf',
    'NIST-ID': 'AC-4(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_CACHE_ENABLED_AND_ENCRYPTED',
    AwsConfigRuleName: 'api-gw-cache-enabled-and-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_CACHE_ENABLED_AND_ENCRYPTED',
    AwsConfigRuleName: 'api-gw-cache-enabled-and-encrypted',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_EXECUTION_LOGGING_ENABLED',
    AwsConfigRuleName: 'api-gw-execution-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_EXECUTION_LOGGING_ENABLED',
    AwsConfigRuleName: 'api-gw-execution-logging-enabled',
    'NIST-ID': 'AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_SSL_ENABLED',
    AwsConfigRuleName: 'api-gw-ssl-enabled',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_SSL_ENABLED',
    AwsConfigRuleName: 'api-gw-ssl-enabled',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_XRAY_ENABLED',
    AwsConfigRuleName: 'api-gw-xray-enabled',
    'NIST-ID': 'CA-7',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_XRAY_ENABLED',
    AwsConfigRuleName: 'api-gw-xray-enabled',
    'NIST-ID': 'CA-7',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GWV2_ACCESS_LOGS_ENABLED',
    AwsConfigRuleName: 'api-gwv2-access-logs-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GWV2_ACCESS_LOGS_ENABLED',
    AwsConfigRuleName: 'api-gwv2-access-logs-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GWV2_AUTHORIZATION_TYPE_CONFIGURED',
    AwsConfigRuleName: 'api-gwv2-authorization-type-configured',
    'NIST-ID': 'AC-3|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GWV2_AUTHORIZATION_TYPE_CONFIGURED',
    AwsConfigRuleName: 'api-gwv2-authorization-type-configured',
    'NIST-ID': 'AC-3|CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APIGATEWAY_DOMAIN_NAME_TLS_CHECK',
    AwsConfigRuleName: 'apigateway-domain-name-tls-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APIGATEWAY_DOMAIN_NAME_TLS_CHECK',
    AwsConfigRuleName: 'apigateway-domain-name-tls-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APIGATEWAY_STAGE_ACCESS_LOGS_ENABLED',
    AwsConfigRuleName: 'apigateway-stage-access-logs-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APIGATEWAY_STAGE_ACCESS_LOGS_ENABLED',
    AwsConfigRuleName: 'apigateway-stage-access-logs-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APIGATEWAYV2_INTEGRATION_PRIVATE_HTTPS_ENABLED',
    AwsConfigRuleName: 'apigatewayv2-integration-private-https-enabled',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APIGATEWAYV2_INTEGRATION_PRIVATE_HTTPS_ENABLED',
    AwsConfigRuleName: 'apigatewayv2-integration-private-https-enabled',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_GATEWAY_BACKEND_DEFAULTS_TLS',
    AwsConfigRuleName: 'appmesh-virtual-gateway-backend-defaults-tls',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_GATEWAY_BACKEND_DEFAULTS_TLS',
    AwsConfigRuleName: 'appmesh-virtual-gateway-backend-defaults-tls',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_GATEWAY_LOGGING_FILE_PATH_EXISTS',
    AwsConfigRuleName: 'appmesh-virtual-gateway-logging-file-path-exists',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_GATEWAY_LOGGING_FILE_PATH_EXISTS',
    AwsConfigRuleName: 'appmesh-virtual-gateway-logging-file-path-exists',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_NODE_BACKEND_DEFAULTS_TLS_ON',
    AwsConfigRuleName: 'appmesh-virtual-node-backend-defaults-tls-on',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_NODE_BACKEND_DEFAULTS_TLS_ON',
    AwsConfigRuleName: 'appmesh-virtual-node-backend-defaults-tls-on',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_NODE_LOGGING_FILE_PATH_EXISTS',
    AwsConfigRuleName: 'appmesh-virtual-node-logging-file-path-exists',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_NODE_LOGGING_FILE_PATH_EXISTS',
    AwsConfigRuleName: 'appmesh-virtual-node-logging-file-path-exists',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_NODE_SERVICE_BACKENDS_TLS_ENFORCED',
    AwsConfigRuleName: 'appmesh-virtual-node-service-backends-tls-enforced',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'APPMESH_VIRTUAL_NODE_SERVICE_BACKENDS_TLS_ENFORCED',
    AwsConfigRuleName: 'appmesh-virtual-node-service-backends-tls-enforced',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPRUNNER_SERVICE_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'apprunner-service-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPRUNNER_SERVICE_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'apprunner-service-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_AUTHORIZATION_CHECK',
    AwsConfigRuleName: 'appsync-authorization-check',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_AUTHORIZATION_CHECK',
    AwsConfigRuleName: 'appsync-authorization-check',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_CACHE_CT_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'appsync-cache-ct-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_CACHE_CT_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'appsync-cache-ct-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_CACHE_CT_ENCRYPTION_IN_TRANSIT',
    AwsConfigRuleName: 'appsync-cache-ct-encryption-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_CACHE_CT_ENCRYPTION_IN_TRANSIT',
    AwsConfigRuleName: 'appsync-cache-ct-encryption-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_CACHE_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'appsync-cache-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_CACHE_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'appsync-cache-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_LOGGING_ENABLED',
    AwsConfigRuleName: 'appsync-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'APPSYNC_LOGGING_ENABLED',
    AwsConfigRuleName: 'appsync-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ATHENA_WORKGROUP_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'athena-workgroup-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ATHENA_WORKGROUP_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'athena-workgroup-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ATHENA_WORKGROUP_LOGGING_ENABLED',
    AwsConfigRuleName: 'athena-workgroup-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ATHENA_WORKGROUP_LOGGING_ENABLED',
    AwsConfigRuleName: 'athena-workgroup-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AURORA_GLOBAL_DATABASE_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'aurora-global-database-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AURORA_GLOBAL_DATABASE_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'aurora-global-database-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AURORA_MYSQL_BACKTRACKING_ENABLED',
    AwsConfigRuleName: 'aurora-mysql-backtracking-enabled',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AURORA_MYSQL_BACKTRACKING_ENABLED',
    AwsConfigRuleName: 'aurora-mysql-backtracking-enabled',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AURORA_MYSQL_CLUSTER_AUDIT_LOGGING',
    AwsConfigRuleName: 'aurora-mysql-cluster-audit-logging',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AURORA_MYSQL_CLUSTER_AUDIT_LOGGING',
    AwsConfigRuleName: 'aurora-mysql-cluster-audit-logging',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_GROUP_ELB_HEALTHCHECK_REQUIRED',
    AwsConfigRuleName: 'autoscaling-group-elb-healthcheck-required',
    'NIST-ID': 'CA-7|CP-2(2)|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_GROUP_ELB_HEALTHCHECK_REQUIRED',
    AwsConfigRuleName: 'autoscaling-group-elb-healthcheck-required',
    'NIST-ID': 'SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_LAUNCH_CONFIG_HOP_LIMIT',
    AwsConfigRuleName: 'autoscaling-launch-config-hop-limit',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_LAUNCH_CONFIG_HOP_LIMIT',
    AwsConfigRuleName: 'autoscaling-launch-config-hop-limit',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'AUTOSCALING_LAUNCH_CONFIG_PUBLIC_IP_DISABLED',
    AwsConfigRuleName: 'autoscaling-launch-config-public-ip-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'AUTOSCALING_LAUNCH_CONFIG_PUBLIC_IP_DISABLED',
    AwsConfigRuleName: 'autoscaling-launch-config-public-ip-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_LAUNCH_TEMPLATE',
    AwsConfigRuleName: 'autoscaling-launch-template',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_LAUNCH_TEMPLATE',
    AwsConfigRuleName: 'autoscaling-launch-template',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_LAUNCHCONFIG_REQUIRES_IMDSV2',
    AwsConfigRuleName: 'autoscaling-launchconfig-requires-imdsv2',
    'NIST-ID': 'AC-3|AC-3(7)|AC-3(15)|AC-6|CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_LAUNCHCONFIG_REQUIRES_IMDSV2',
    AwsConfigRuleName: 'autoscaling-launchconfig-requires-imdsv2',
    'NIST-ID': 'AC-3|AC-3(7)|AC-6|CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_MULTIPLE_AZ',
    AwsConfigRuleName: 'autoscaling-multiple-az',
    'NIST-ID': 'CP-2(2)|CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_MULTIPLE_AZ',
    AwsConfigRuleName: 'autoscaling-multiple-az',
    'NIST-ID': 'CP-2(2)|CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_MULTIPLE_INSTANCE_TYPES',
    AwsConfigRuleName: 'autoscaling-multiple-instance-types',
    'NIST-ID': 'CP-2(2)|CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_MULTIPLE_INSTANCE_TYPES',
    AwsConfigRuleName: 'autoscaling-multiple-instance-types',
    'NIST-ID': 'CP-2(2)|CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'BACKUP_RECOVERY_POINT_ENCRYPTED',
    AwsConfigRuleName: 'backup-recovery-point-encrypted',
    'NIST-ID': 'CP-9(8)|SI-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'BACKUP_RECOVERY_POINT_ENCRYPTED',
    AwsConfigRuleName: 'backup-recovery-point-encrypted',
    'NIST-ID': 'CP-9|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'BEANSTALK_ENHANCED_HEALTH_REPORTING_ENABLED',
    AwsConfigRuleName: 'beanstalk-enhanced-health-reporting-enabled',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'BEANSTALK_ENHANCED_HEALTH_REPORTING_ENABLED',
    AwsConfigRuleName: 'beanstalk-enhanced-health-reporting-enabled',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'BEDROCK_AGENTCORE_MEMORY_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'bedrock-agentcore-memory-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'BEDROCK_AGENTCORE_MEMORY_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'bedrock-agentcore-memory-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'BEDROCK_DATA_SOURCE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'bedrock-data-source-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'BEDROCK_DATA_SOURCE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'bedrock-data-source-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'BEDROCKAGENTCORE_GATEWAY_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'bedrockagentcore-gateway-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'BEDROCKAGENTCORE_GATEWAY_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'bedrockagentcore-gateway-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLB_DESYNC_MODE_CHECK',
    AwsConfigRuleName: 'clb-desync-mode-check',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLB_DESYNC_MODE_CHECK',
    AwsConfigRuleName: 'clb-desync-mode-check',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLB_MULTIPLE_AZ',
    AwsConfigRuleName: 'clb-multiple-az',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLB_MULTIPLE_AZ',
    AwsConfigRuleName: 'clb-multiple-az',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_CLOUD_WATCH_LOGS_ENABLED',
    AwsConfigRuleName: 'cloud-trail-cloud-watch-logs-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(1)|AU-6(3)|AU-6(4)|AU-6(5)|AU-7(1)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(5)|SI-4(20)|SI-7(8)|SI-20',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_CLOUD_WATCH_LOGS_ENABLED',
    AwsConfigRuleName: 'cloud-trail-cloud-watch-logs-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(g)|AU-2(a)|AU-2(d)|AU-3|AU-6(1)|AU-6(3)|AU-7(1)|AU-12(a)|AU-12(c)|CA-7(a)|CA-7(b)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'cloud-trail-encryption-enabled',
    'NIST-ID': 'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'cloud-trail-encryption-enabled',
    'NIST-ID': 'AU-9|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_LOG_FILE_VALIDATION_ENABLED',
    AwsConfigRuleName: 'cloud-trail-log-file-validation-enabled',
    'NIST-ID': 'AU-9|SI-4|SI-7(1)|SI-7(3)|SI-7(7)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_LOG_FILE_VALIDATION_ENABLED',
    AwsConfigRuleName: 'cloud-trail-log-file-validation-enabled',
    'NIST-ID': 'SI-7|SI-7(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFORMATION_STACK_NOTIFICATION_CHECK',
    AwsConfigRuleName: 'cloudformation-stack-notification-check',
    'NIST-ID': 'SI-4(5)|SI-4(12)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFORMATION_STACK_NOTIFICATION_CHECK',
    AwsConfigRuleName: 'cloudformation-stack-notification-check',
    'NIST-ID': 'SI-4(5)|SI-4(12)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_ACCESSLOGS_ENABLED',
    AwsConfigRuleName: 'cloudfront-accesslogs-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_ACCESSLOGS_ENABLED',
    AwsConfigRuleName: 'cloudfront-accesslogs-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_ASSOCIATED_WITH_WAF',
    AwsConfigRuleName: 'cloudfront-associated-with-waf',
    'NIST-ID': 'AC-4(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_ASSOCIATED_WITH_WAF',
    AwsConfigRuleName: 'cloudfront-associated-with-waf',
    'NIST-ID': 'AC-4(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_CUSTOM_SSL_CERTIFICATE',
    AwsConfigRuleName: 'cloudfront-custom-ssl-certificate',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_CUSTOM_SSL_CERTIFICATE',
    AwsConfigRuleName: 'cloudfront-custom-ssl-certificate',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_DEFAULT_ROOT_OBJECT_CONFIGURED',
    AwsConfigRuleName: 'cloudfront-default-root-object-configured',
    'NIST-ID': 'SC-7(11)|SC-7(16)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_DEFAULT_ROOT_OBJECT_CONFIGURED',
    AwsConfigRuleName: 'cloudfront-default-root-object-configured',
    'NIST-ID': 'SC-7(11)|SC-7(16)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_NO_DEPRECATED_SSL_PROTOCOLS',
    AwsConfigRuleName: 'cloudfront-no-deprecated-ssl-protocols',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_NO_DEPRECATED_SSL_PROTOCOLS',
    AwsConfigRuleName: 'cloudfront-no-deprecated-ssl-protocols',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_ORIGIN_FAILOVER_ENABLED',
    AwsConfigRuleName: 'cloudfront-origin-failover-enabled',
    'NIST-ID': 'CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_ORIGIN_FAILOVER_ENABLED',
    AwsConfigRuleName: 'cloudfront-origin-failover-enabled',
    'NIST-ID': 'CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_S3_ORIGIN_NON_EXISTENT_BUCKET',
    AwsConfigRuleName: 'cloudfront-s3-origin-non-existent-bucket',
    'NIST-ID': 'CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_S3_ORIGIN_NON_EXISTENT_BUCKET',
    AwsConfigRuleName: 'cloudfront-s3-origin-non-existent-bucket',
    'NIST-ID': 'CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_SNI_ENABLED',
    AwsConfigRuleName: 'cloudfront-sni-enabled',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_SNI_ENABLED',
    AwsConfigRuleName: 'cloudfront-sni-enabled',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_SSL_POLICY_CHECK',
    AwsConfigRuleName: 'cloudfront-ssl-policy-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_SSL_POLICY_CHECK',
    AwsConfigRuleName: 'cloudfront-ssl-policy-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_TRAFFIC_TO_ORIGIN_ENCRYPTED',
    AwsConfigRuleName: 'cloudfront-traffic-to-origin-encrypted',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_TRAFFIC_TO_ORIGIN_ENCRYPTED',
    AwsConfigRuleName: 'cloudfront-traffic-to-origin-encrypted',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_VIEWER_POLICY_HTTPS',
    AwsConfigRuleName: 'cloudfront-viewer-policy-https',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDFRONT_VIEWER_POLICY_HTTPS',
    AwsConfigRuleName: 'cloudfront-viewer-policy-https',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_ALL_READ_S3_DATA_EVENT_CHECK',
    AwsConfigRuleName: 'cloudtrail-all-read-s3-data-event-check',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_ALL_READ_S3_DATA_EVENT_CHECK',
    AwsConfigRuleName: 'cloudtrail-all-read-s3-data-event-check',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_ALL_WRITE_S3_DATA_EVENT_CHECK',
    AwsConfigRuleName: 'cloudtrail-all-write-s3-data-event-check',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_ALL_WRITE_S3_DATA_EVENT_CHECK',
    AwsConfigRuleName: 'cloudtrail-all-write-s3-data-event-check',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_ENABLED',
    AwsConfigRuleName: 'cloudtrail-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9|AU-10|AU-12|AU-14(1)|CA-7|SA-8(22)|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_ENABLED',
    AwsConfigRuleName: 'cloudtrail-enabled',
    'NIST-ID': 'AC-2(4)|AC-2(g)|AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_EVENT_DATA_STORE_MULTI_REGION',
    AwsConfigRuleName: 'cloudtrail-event-data-store-multi-region',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_EVENT_DATA_STORE_MULTI_REGION',
    AwsConfigRuleName: 'cloudtrail-event-data-store-multi-region',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_S3_BUCKET_ACCESS_LOGGING',
    AwsConfigRuleName: 'cloudtrail-s3-bucket-access-logging',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_S3_BUCKET_ACCESS_LOGGING',
    AwsConfigRuleName: 'cloudtrail-s3-bucket-access-logging',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'CLOUDTRAIL_S3_BUCKET_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 'cloudtrail-s3-bucket-public-access-prohibited',
    'NIST-ID':
      'AC-3|AC-4(26)|AC-21|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'CLOUDTRAIL_S3_BUCKET_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 'cloudtrail-s3-bucket-public-access-prohibited',
    'NIST-ID':
      'AC-3|AC-4|AC-21|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_S3_DATAEVENTS_ENABLED',
    AwsConfigRuleName: 'cloudtrail-s3-dataevents-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_S3_DATAEVENTS_ENABLED',
    AwsConfigRuleName: 'cloudtrail-s3-dataevents-enabled',
    'NIST-ID': 'AC-2(g)|AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_SECURITY_TRAIL_ENABLED',
    AwsConfigRuleName: 'cloudtrail-security-trail-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_SECURITY_TRAIL_ENABLED',
    AwsConfigRuleName: 'cloudtrail-security-trail-enabled',
    'NIST-ID': 'CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_ALARM_ACTION_CHECK',
    AwsConfigRuleName: 'cloudwatch-alarm-action-check',
    'NIST-ID':
      'AU-6(1)|AU-6(5)|CA-7|IR-4(1)|IR-4(5)|SI-2|SI-4(5)|SI-4(12)|SI-20',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_ALARM_ACTION_CHECK',
    AwsConfigRuleName: 'cloudwatch-alarm-action-check',
    'NIST-ID':
      'AC-2(4)|AU-6(1)|AU-6(3)|AU-7(1)|CA-7(a)|CA-7(b)|IR-4(1)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_ALARM_ACTION_ENABLED_CHECK',
    AwsConfigRuleName: 'cloudwatch-alarm-action-enabled-check',
    'NIST-ID': 'AU-6(1)|AU-6(5)|CA-7|SI-2|SI-4(12)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_ALARM_ACTION_ENABLED_CHECK',
    AwsConfigRuleName: 'cloudwatch-alarm-action-enabled-check',
    'NIST-ID': 'AU-6(1)|AU-6(5)|CA-7|SI-2|SI-4(12)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
    AwsConfigRuleName: 'cloudwatch-log-group-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
    AwsConfigRuleName: 'cloudwatch-log-group-encrypted',
    'NIST-ID': 'AU-9|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CMK_BACKING_KEY_ROTATION_ENABLED',
    AwsConfigRuleName: 'cmk-backing-key-rotation-enabled',
    'NIST-ID': 'SC-12|SC-12(2)|SC-28(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CMK_BACKING_KEY_ROTATION_ENABLED',
    AwsConfigRuleName: 'cmk-backing-key-rotation-enabled',
    'NIST-ID': 'SC-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_ARTIFACT_ENCRYPTION',
    AwsConfigRuleName: 'codebuild-project-artifact-encryption',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_ARTIFACT_ENCRYPTION',
    AwsConfigRuleName: 'codebuild-project-artifact-encryption',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'CODEBUILD_PROJECT_ENVIRONMENT_PRIVILEGED_CHECK',
    AwsConfigRuleName: 'codebuild-project-environment-privileged-check',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-5|AC-6|AC-6(2)|AC-6(10)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'CODEBUILD_PROJECT_ENVIRONMENT_PRIVILEGED_CHECK',
    AwsConfigRuleName: 'codebuild-project-environment-privileged-check',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-5|AC-6|AC-6(2)|AC-6(10)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_ENVVAR_AWSCRED_CHECK',
    AwsConfigRuleName: 'codebuild-project-envvar-awscred-check',
    'NIST-ID': 'IA-5(7)|SA-3',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_ENVVAR_AWSCRED_CHECK',
    AwsConfigRuleName: 'codebuild-project-envvar-awscred-check',
    'NIST-ID': 'AC-6|IA-5(7)|SA-3(a)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_LOGGING_ENABLED',
    AwsConfigRuleName: 'codebuild-project-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_LOGGING_ENABLED',
    AwsConfigRuleName: 'codebuild-project-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_S3_LOGS_ENCRYPTED',
    AwsConfigRuleName: 'codebuild-project-s3-logs-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_S3_LOGS_ENCRYPTED',
    AwsConfigRuleName: 'codebuild-project-s3-logs-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_SOURCE_REPO_URL_CHECK',
    AwsConfigRuleName: 'codebuild-project-source-repo-url-check',
    'NIST-ID': 'SA-3',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_SOURCE_REPO_URL_CHECK',
    AwsConfigRuleName: 'codebuild-project-source-repo-url-check',
    'NIST-ID': 'SA-3(a)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_REPORT_GROUP_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'codebuild-report-group-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_REPORT_GROUP_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'codebuild-report-group-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CONNECT_INSTANCE_LOGGING_ENABLED',
    AwsConfigRuleName: 'connect-instance-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CONNECT_INSTANCE_LOGGING_ENABLED',
    AwsConfigRuleName: 'connect-instance-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CUSTOM_EVENTBUS_POLICY_ATTACHED',
    AwsConfigRuleName: 'custom-eventbus-policy-attached',
    'NIST-ID': 'AC-2|AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-5|AC-6|AC-6(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CUSTOM_EVENTBUS_POLICY_ATTACHED',
    AwsConfigRuleName: 'custom-eventbus-policy-attached',
    'NIST-ID': 'AC-2|AC-2(1)|AC-3|AC-3(7)|AC-5|AC-6|AC-6(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CW_LOGGROUP_RETENTION_PERIOD_CHECK',
    AwsConfigRuleName: 'cw-loggroup-retention-period-check',
    'NIST-ID': 'AU-6(3)|AU-6(4)|AU-10|AU-11|CA-7|SI-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'CW_LOGGROUP_RETENTION_PERIOD_CHECK',
    AwsConfigRuleName: 'cw-loggroup-retention-period-check',
    'NIST-ID': 'AU-11|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'DATASYNC_LOCATION_OBJECT_STORAGE_USING_HTTPS',
    AwsConfigRuleName: 'datasync-location-object-storage-using-https',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'DATASYNC_LOCATION_OBJECT_STORAGE_USING_HTTPS',
    AwsConfigRuleName: 'datasync-location-object-storage-using-https',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DATASYNC_TASK_LOGGING_ENABLED',
    AwsConfigRuleName: 'datasync-task-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DATASYNC_TASK_LOGGING_ENABLED',
    AwsConfigRuleName: 'datasync-task-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DAX_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'dax-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DAX_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'dax-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DAX_TLS_ENDPOINT_ENCRYPTION',
    AwsConfigRuleName: 'dax-tls-endpoint-encryption',
    'NIST-ID': 'AC-17|SC-8|SC-13|SC-23',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DAX_TLS_ENDPOINT_ENCRYPTION',
    AwsConfigRuleName: 'dax-tls-endpoint-encryption',
    'NIST-ID': 'AC-17|SC-8|SC-13|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DB_INSTANCE_BACKUP_ENABLED',
    AwsConfigRuleName: 'db-instance-backup-enabled',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DB_INSTANCE_BACKUP_ENABLED',
    AwsConfigRuleName: 'db-instance-backup-enabled',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_AUTO_MINOR_VERSION_UPGRADE_CHECK',
    AwsConfigRuleName: 'dms-auto-minor-version-upgrade-check',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_AUTO_MINOR_VERSION_UPGRADE_CHECK',
    AwsConfigRuleName: 'dms-auto-minor-version-upgrade-check',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_ENDPOINT_SSL_CONFIGURED',
    AwsConfigRuleName: 'dms-endpoint-ssl-configured',
    'NIST-ID': 'AC-4|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_ENDPOINT_SSL_CONFIGURED',
    AwsConfigRuleName: 'dms-endpoint-ssl-configured',
    'NIST-ID': 'AC-4|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_MONGO_DB_AUTHENTICATION_ENABLED',
    AwsConfigRuleName: 'dms-mongo-db-authentication-enabled',
    'NIST-ID': 'AC-3|AC-6|IA-2|IA-5',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_MONGO_DB_AUTHENTICATION_ENABLED',
    AwsConfigRuleName: 'dms-mongo-db-authentication-enabled',
    'NIST-ID': 'AC-3|AC-6|IA-2|IA-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_NEPTUNE_IAM_AUTHORIZATION_ENABLED',
    AwsConfigRuleName: 'dms-neptune-iam-authorization-enabled',
    'NIST-ID': 'AC-2|AC-3|AC-6|AC-17|IA-2|IA-5',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_NEPTUNE_IAM_AUTHORIZATION_ENABLED',
    AwsConfigRuleName: 'dms-neptune-iam-authorization-enabled',
    'NIST-ID': 'AC-2|AC-3|AC-6|AC-17|IA-2|IA-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REDIS_TLS_ENABLED',
    AwsConfigRuleName: 'dms-redis-tls-enabled',
    'NIST-ID': 'SC-8|SC-13',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REDIS_TLS_ENABLED',
    AwsConfigRuleName: 'dms-redis-tls-enabled',
    'NIST-ID': 'SC-8|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_NOT_PUBLIC',
    AwsConfigRuleName: 'dms-replication-not-public',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_NOT_PUBLIC',
    AwsConfigRuleName: 'dms-replication-not-public',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_TASK_SOURCEDB_LOGGING',
    AwsConfigRuleName: 'dms-replication-task-sourcedb-logging',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_TASK_SOURCEDB_LOGGING',
    AwsConfigRuleName: 'dms-replication-task-sourcedb-logging',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_TASK_TARGETDB_LOGGING',
    AwsConfigRuleName: 'dms-replication-task-targetdb-logging',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_TASK_TARGETDB_LOGGING',
    AwsConfigRuleName: 'dms-replication-task-targetdb-logging',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'docdb-cluster-audit-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'docdb-cluster-audit-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_BACKUP_RETENTION_CHECK',
    AwsConfigRuleName: 'docdb-cluster-backup-retention-check',
    'NIST-ID': 'SI-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_BACKUP_RETENTION_CHECK',
    AwsConfigRuleName: 'docdb-cluster-backup-retention-check',
    'NIST-ID': 'SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'docdb-cluster-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'docdb-cluster-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_ENCRYPTED',
    AwsConfigRuleName: 'docdb-cluster-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_ENCRYPTED',
    AwsConfigRuleName: 'docdb-cluster-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'docdb-cluster-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'docdb-cluster-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_SNAPSHOT_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'docdb-cluster-snapshot-public-prohibited',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DOCDB_CLUSTER_SNAPSHOT_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'docdb-cluster-snapshot-public-prohibited',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_AUTOSCALING_ENABLED',
    AwsConfigRuleName: 'dynamodb-autoscaling-enabled',
    'NIST-ID': 'CP-2(2)|CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_AUTOSCALING_ENABLED',
    AwsConfigRuleName: 'dynamodb-autoscaling-enabled',
    'NIST-ID': 'CP-10|SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'dynamodb-in-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'dynamodb-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_PITR_ENABLED',
    AwsConfigRuleName: 'dynamodb-pitr-enabled',
    'NIST-ID': 'CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_PITR_ENABLED',
    AwsConfigRuleName: 'dynamodb-pitr-enabled',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'DYNAMODB_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
    AwsConfigRuleName: 'dynamodb-resources-protected-by-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'DYNAMODB_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
    AwsConfigRuleName: 'dynamodb-resources-protected-by-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'dynamodb-table-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'dynamodb-table-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTED_KMS',
    AwsConfigRuleName: 'dynamodb-table-encrypted-kms',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTED_KMS',
    AwsConfigRuleName: 'dynamodb-table-encrypted-kms',
    'NIST-ID': 'SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'dynamodb-table-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'dynamodb-table-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_THROUGHPUT_LIMIT_CHECK',
    AwsConfigRuleName: 'dynamodb-throughput-limit-check',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_THROUGHPUT_LIMIT_CHECK',
    AwsConfigRuleName: 'dynamodb-throughput-limit-check',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'ebs-in-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'ebs-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_OPTIMIZED_INSTANCE',
    AwsConfigRuleName: 'ebs-optimized-instance',
    'NIST-ID': 'CP-9|CP-10|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_OPTIMIZED_INSTANCE',
    AwsConfigRuleName: 'ebs-optimized-instance',
    'NIST-ID': 'CP-9|CP-10|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
    AwsConfigRuleName: 'ebs-resources-protected-by-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
    AwsConfigRuleName: 'ebs-resources-protected-by-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_SNAPSHOT_BLOCK_PUBLIC_ACCESS',
    AwsConfigRuleName: 'ebs-snapshot-block-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_SNAPSHOT_BLOCK_PUBLIC_ACCESS',
    AwsConfigRuleName: 'ebs-snapshot-block-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_SNAPSHOT_PUBLIC_RESTORABLE_CHECK',
    AwsConfigRuleName: 'ebs-snapshot-public-restorable-check',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_SNAPSHOT_PUBLIC_RESTORABLE_CHECK',
    AwsConfigRuleName: 'ebs-snapshot-public-restorable-check',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_CLIENT_VPN_CONNECTION_LOG_ENABLED',
    AwsConfigRuleName: 'ec2-client-vpn-connection-log-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_CLIENT_VPN_CONNECTION_LOG_ENABLED',
    AwsConfigRuleName: 'ec2-client-vpn-connection-log-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_EBS_ENCRYPTION_BY_DEFAULT',
    AwsConfigRuleName: 'ec2-ebs-encryption-by-default',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_EBS_ENCRYPTION_BY_DEFAULT',
    AwsConfigRuleName: 'ec2-ebs-encryption-by-default',
    'NIST-ID': 'SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_IMDSV2_CHECK',
    AwsConfigRuleName: 'ec2-imdsv2-check',
    'NIST-ID': 'AC-3|AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_IMDSV2_CHECK',
    AwsConfigRuleName: 'ec2-imdsv2-check',
    'NIST-ID': 'AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_DETAILED_MONITORING_ENABLED',
    AwsConfigRuleName: 'ec2-instance-detailed-monitoring-enabled',
    'NIST-ID': 'CA-7|SI-4|SI-4(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_DETAILED_MONITORING_ENABLED',
    AwsConfigRuleName: 'ec2-instance-detailed-monitoring-enabled',
    'NIST-ID': 'CA-7(a)|CA-7(b)|SI-4(2)|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_MANAGED_BY_SSM',
    AwsConfigRuleName: 'ec2-instance-managed-by-systems-manager',
    'NIST-ID':
      'CA-9(1)|CM-2|CM-2(2)|CM-8|CM-8(1)|CM-8(2)|CM-8(3)|SA-3|SA-15(2)|SA-15(8)|SI-2(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_MANAGED_BY_SSM',
    AwsConfigRuleName: 'ec2-instance-managed-by-systems-manager',
    'NIST-ID': 'CM-2|CM-7(a)|CM-8(1)|CM-8(3)(a)|SA-3(a)|SA-10|SI-2(2)|SI-7(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_MULTIPLE_ENI_CHECK',
    AwsConfigRuleName: 'ec2-instance-multiple-eni-check',
    'NIST-ID': 'AC-4(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_MULTIPLE_ENI_CHECK',
    AwsConfigRuleName: 'ec2-instance-multiple-eni-check',
    'NIST-ID': 'AC-4(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_NO_PUBLIC_IP',
    AwsConfigRuleName: 'ec2-instance-no-public-ip',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_NO_PUBLIC_IP',
    AwsConfigRuleName: 'ec2-instance-no-public-ip',
    'NIST-ID': 'AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_PROFILE_ATTACHED',
    AwsConfigRuleName: 'ec2-instance-profile-attached',
    'NIST-ID': 'AC-3|AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_PROFILE_ATTACHED',
    AwsConfigRuleName: 'ec2-instance-profile-attached',
    'NIST-ID': 'AC-3',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'INSTANCES_IN_VPC',
    AwsConfigRuleName: 'ec2-instances-in-vpc',
    'NIST-ID': 'AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'INSTANCES_IN_VPC',
    AwsConfigRuleName: 'ec2-instances-in-vpc',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_LAUNCH_TEMPLATE_PUBLIC_IP_DISABLED',
    AwsConfigRuleName: 'ec2-launch-template-public-ip-disabled',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_LAUNCH_TEMPLATE_PUBLIC_IP_DISABLED',
    AwsConfigRuleName: 'ec2-launch-template-public-ip-disabled',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_LAUNCH_TEMPLATES_EBS_VOLUME_ENCRYPTED',
    AwsConfigRuleName: 'ec2-launch-templates-ebs-volume-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_LAUNCH_TEMPLATES_EBS_VOLUME_ENCRYPTED',
    AwsConfigRuleName: 'ec2-launch-templates-ebs-volume-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_LAUNCHTEMPLATE_EBS_ENCRYPTED',
    AwsConfigRuleName: 'ec2-launchtemplate-ebs-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_LAUNCHTEMPLATE_EBS_ENCRYPTED',
    AwsConfigRuleName: 'ec2-launchtemplate-ebs-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_MANAGEDINSTANCE_ASSOCIATION_COMPLIANCE_STATUS_CHECK',
    AwsConfigRuleName:
      'ec2-managedinstance-association-compliance-status-check',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-8|CM-8(1)|CM-8(3)|SI-2(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_MANAGEDINSTANCE_ASSOCIATION_COMPLIANCE_STATUS_CHECK',
    AwsConfigRuleName:
      'ec2-managedinstance-association-compliance-status-check',
    'NIST-ID': 'CM-2|CM-7(a)|CM-8(3)(a)|SI-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_MANAGEDINSTANCE_PATCH_COMPLIANCE_STATUS_CHECK',
    AwsConfigRuleName: 'ec2-managedinstance-patch-compliance-status-check',
    'NIST-ID': 'CM-8(3)|SI-2|SI-2(2)|SI-2(3)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_MANAGEDINSTANCE_PATCH_COMPLIANCE_STATUS_CHECK',
    AwsConfigRuleName: 'ec2-managedinstance-patch-compliance-status-check',
    'NIST-ID': 'CM-8(3)(a)|SI-2(2)|SI-7(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_PARAVIRTUAL_INSTANCE_CHECK',
    AwsConfigRuleName: 'ec2-paravirtual-instance-check',
    'NIST-ID': 'CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_PARAVIRTUAL_INSTANCE_CHECK',
    AwsConfigRuleName: 'ec2-paravirtual-instance-check',
    'NIST-ID': 'CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_SPOT_FLEET_REQUEST_CT_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'ec2-spot-fleet-request-ct-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_SPOT_FLEET_REQUEST_CT_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'ec2-spot-fleet-request-ct-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_STOPPED_INSTANCE',
    AwsConfigRuleName: 'ec2-stopped-instance',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_STOPPED_INSTANCE',
    AwsConfigRuleName: 'ec2-stopped-instance',
    'NIST-ID': 'CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_TRANSIT_GATEWAY_AUTO_VPC_ATTACH_DISABLED',
    AwsConfigRuleName: 'ec2-transit-gateway-auto-vpc-attach-disabled',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_TRANSIT_GATEWAY_AUTO_VPC_ATTACH_DISABLED',
    AwsConfigRuleName: 'ec2-transit-gateway-auto-vpc-attach-disabled',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_VOLUME_INUSE_CHECK',
    AwsConfigRuleName: 'ec2-volume-inuse-check',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_VOLUME_INUSE_CHECK',
    AwsConfigRuleName: 'ec2-volume-inuse-check',
    'NIST-ID': 'CM-2|SC-4',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_VPN_CONNECTION_LOGGING_ENABLED',
    AwsConfigRuleName: 'ec2-vpn-connection-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_VPN_CONNECTION_LOGGING_ENABLED',
    AwsConfigRuleName: 'ec2-vpn-connection-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_PRIVATE_IMAGE_SCANNING_ENABLED',
    AwsConfigRuleName: 'ecr-private-image-scanning-enabled',
    'NIST-ID': 'RA-5',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_PRIVATE_IMAGE_SCANNING_ENABLED',
    AwsConfigRuleName: 'ecr-private-image-scanning-enabled',
    'NIST-ID': 'RA-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_PRIVATE_LIFECYCLE_POLICY_CONFIGURED',
    AwsConfigRuleName: 'ecr-private-lifecycle-policy-configured',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_PRIVATE_LIFECYCLE_POLICY_CONFIGURED',
    AwsConfigRuleName: 'ecr-private-lifecycle-policy-configured',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_PRIVATE_TAG_IMMUTABILITY_ENABLED',
    AwsConfigRuleName: 'ecr-private-tag-immutability-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-8(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_PRIVATE_TAG_IMMUTABILITY_ENABLED',
    AwsConfigRuleName: 'ecr-private-tag-immutability-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-8(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_REPOSITORY_CMK_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'ecr-repository-cmk-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECR_REPOSITORY_CMK_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'ecr-repository-cmk-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_CONTAINER_INSIGHTS_ENABLED',
    AwsConfigRuleName: 'ecs-container-insights-enabled',
    'NIST-ID': 'AU-6(3)|AU-6(4)|CA-7|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_CONTAINER_INSIGHTS_ENABLED',
    AwsConfigRuleName: 'ecs-container-insights-enabled',
    'NIST-ID': 'AU-6(3)|AU-6(4)|CA-7|SI-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_CONTAINERS_NONPRIVILEGED',
    AwsConfigRuleName: 'ecs-containers-nonprivileged',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-5|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_CONTAINERS_NONPRIVILEGED',
    AwsConfigRuleName: 'ecs-containers-nonprivileged',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-5|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_CONTAINERS_READONLY_ACCESS',
    AwsConfigRuleName: 'ecs-containers-readonly-access',
    'NIST-ID': 'AC-3|AC-3(15)|AC-5',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_CONTAINERS_READONLY_ACCESS',
    AwsConfigRuleName: 'ecs-containers-readonly-access',
    'NIST-ID': 'AC-3|AC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_FARGATE_LATEST_PLATFORM_VERSION',
    AwsConfigRuleName: 'ecs-fargate-latest-platform-version',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_FARGATE_LATEST_PLATFORM_VERSION',
    AwsConfigRuleName: 'ecs-fargate-latest-platform-version',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_NO_ENVIRONMENT_SECRETS',
    AwsConfigRuleName: 'ecs-no-environment-secrets',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_NO_ENVIRONMENT_SECRETS',
    AwsConfigRuleName: 'ecs-no-environment-secrets',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_EFS_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'ecs-task-definition-efs-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_EFS_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'ecs-task-definition-efs-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_LOG_CONFIGURATION',
    AwsConfigRuleName: 'ecs-task-definition-log-configuration',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_LOG_CONFIGURATION',
    AwsConfigRuleName: 'ecs-task-definition-log-configuration',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_NETWORK_MODE_NOT_HOST',
    AwsConfigRuleName: 'ecs-task-definition-network-mode-not-host',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-5|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_NETWORK_MODE_NOT_HOST',
    AwsConfigRuleName: 'ecs-task-definition-network-mode-not-host',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-5|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_PID_MODE_CHECK',
    AwsConfigRuleName: 'ecs-task-definition-pid-mode-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ECS_TASK_DEFINITION_PID_MODE_CHECK',
    AwsConfigRuleName: 'ecs-task-definition-pid-mode-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ECS_TASK_DEFINITION_USER_FOR_HOST_MODE_CHECK',
    AwsConfigRuleName: 'ecs-task-definition-user-for-host-mode-check',
    'NIST-ID': 'AC-3|AC-3(15)|AC-5',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ECS_TASK_DEFINITION_USER_FOR_HOST_MODE_CHECK',
    AwsConfigRuleName: 'ecs-task-definition-user-for-host-mode-check',
    'NIST-ID': 'AC-3|AC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ACCESS_POINT_ENFORCE_ROOT_DIRECTORY',
    AwsConfigRuleName: 'efs-access-point-enforce-root-directory',
    'NIST-ID': 'AC-6(10)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ACCESS_POINT_ENFORCE_ROOT_DIRECTORY',
    AwsConfigRuleName: 'efs-access-point-enforce-root-directory',
    'NIST-ID': 'AC-6(10)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ACCESS_POINT_ENFORCE_USER_IDENTITY',
    AwsConfigRuleName: 'efs-access-point-enforce-user-identity',
    'NIST-ID': 'AC-6(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ACCESS_POINT_ENFORCE_USER_IDENTITY',
    AwsConfigRuleName: 'efs-access-point-enforce-user-identity',
    'NIST-ID': 'AC-6(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ENCRYPTED_CHECK',
    AwsConfigRuleName: 'efs-encrypted-check',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ENCRYPTED_CHECK',
    AwsConfigRuleName: 'efs-encrypted-check',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_FILESYSTEM_CT_ENCRYPTED',
    AwsConfigRuleName: 'efs-filesystem-ct-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_FILESYSTEM_CT_ENCRYPTED',
    AwsConfigRuleName: 'efs-filesystem-ct-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'efs-in-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'efs-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_MOUNT_TARGET_PUBLIC_ACCESSIBLE',
    AwsConfigRuleName: 'efs-mount-target-public-accessible',
    'NIST-ID': 'SC-7',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_MOUNT_TARGET_PUBLIC_ACCESSIBLE',
    AwsConfigRuleName: 'efs-mount-target-public-accessible',
    'NIST-ID': 'SC-7',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EIP_ATTACHED',
    AwsConfigRuleName: 'eip-attached',
    'NIST-ID': 'CM-8(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EIP_ATTACHED',
    AwsConfigRuleName: 'eip-attached',
    'NIST-ID': 'CM-8(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_LOG_ENABLED',
    AwsConfigRuleName: 'eks-cluster-log-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_LOG_ENABLED',
    AwsConfigRuleName: 'eks-cluster-log-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_LOGGING_ENABLED',
    AwsConfigRuleName: 'eks-cluster-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_LOGGING_ENABLED',
    AwsConfigRuleName: 'eks-cluster-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_SECRETS_ENCRYPTED',
    AwsConfigRuleName: 'eks-cluster-secrets-encrypted',
    'NIST-ID': 'SC-8|SC-12|SC-13|SC-28',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_SECRETS_ENCRYPTED',
    AwsConfigRuleName: 'eks-cluster-secrets-encrypted',
    'NIST-ID': 'SC-8|SC-12|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_SUPPORTED_VERSION',
    AwsConfigRuleName: 'eks-cluster-supported-version',
    'NIST-ID': 'CA-9(1)|CM-2|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_CLUSTER_SUPPORTED_VERSION',
    AwsConfigRuleName: 'eks-cluster-supported-version',
    'NIST-ID': 'CA-9(1)|CM-2|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_ENDPOINT_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'eks-endpoint-no-public-access',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_ENDPOINT_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'eks-endpoint-no-public-access',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_SECRETS_ENCRYPTED',
    AwsConfigRuleName: 'eks-secrets-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EKS_SECRETS_ENCRYPTED',
    AwsConfigRuleName: 'eks-secrets-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTIC_BEANSTALK_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'elastic-beanstalk-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTIC_BEANSTALK_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'elastic-beanstalk-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTIC_BEANSTALK_MANAGED_UPDATES_ENABLED',
    AwsConfigRuleName: 'elastic-beanstalk-managed-updates-enabled',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTIC_BEANSTALK_MANAGED_UPDATES_ENABLED',
    AwsConfigRuleName: 'elastic-beanstalk-managed-updates-enabled',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICACHE_AUTO_MINOR_VERSION_UPGRADE_CHECK',
    AwsConfigRuleName: 'elasticache-auto-minor-version-upgrade-check',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICACHE_AUTO_MINOR_VERSION_UPGRADE_CHECK',
    AwsConfigRuleName: 'elasticache-auto-minor-version-upgrade-check',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICACHE_REDIS_CLUSTER_AUTOMATIC_BACKUP_CHECK',
    AwsConfigRuleName: 'elasticache-redis-cluster-automatic-backup-check',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICACHE_REDIS_CLUSTER_AUTOMATIC_BACKUP_CHECK',
    AwsConfigRuleName: 'elasticache-redis-cluster-automatic-backup-check',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_AUTO_FAILOVER_ENABLED',
    AwsConfigRuleName: 'elasticache-repl-grp-auto-failover-enabled',
    'NIST-ID': 'CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_AUTO_FAILOVER_ENABLED',
    AwsConfigRuleName: 'elasticache-repl-grp-auto-failover-enabled',
    'NIST-ID': 'CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'elasticache-repl-grp-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'elasticache-repl-grp-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'elasticache-repl-grp-encrypted-in-transit',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'elasticache-repl-grp-encrypted-in-transit',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_REDIS_AUTH_ENABLED',
    AwsConfigRuleName: 'elasticache-repl-grp-redis-auth-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_REPL_GRP_REDIS_AUTH_ENABLED',
    AwsConfigRuleName: 'elasticache-repl-grp-redis-auth-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_SUBNET_GROUP_CHECK',
    AwsConfigRuleName: 'elasticache-subnet-group-check',
    'NIST-ID': 'AC-4|AC-4(21)|SC-7|SC-7(4)|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICACHE_SUBNET_GROUP_CHECK',
    AwsConfigRuleName: 'elasticache-subnet-group-check',
    'NIST-ID': 'AC-4|AC-4(21)|SC-7|SC-7(4)|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'elasticsearch-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'elasticsearch-encrypted-at-rest',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_IN_VPC_ONLY',
    AwsConfigRuleName: 'elasticsearch-in-vpc-only',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_IN_VPC_ONLY',
    AwsConfigRuleName: 'elasticsearch-in-vpc-only',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'elasticsearch-logs-to-cloudwatch',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'elasticsearch-logs-to-cloudwatch',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICSEARCH_NODE_TO_NODE_ENCRYPTION_CHECK',
    AwsConfigRuleName: 'elasticsearch-node-to-node-encryption-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICSEARCH_NODE_TO_NODE_ENCRYPTION_CHECK',
    AwsConfigRuleName: 'elasticsearch-node-to-node-encryption-check',
    'NIST-ID': 'SC-7|SC-8|SC-8(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_ACM_CERTIFICATE_REQUIRED',
    AwsConfigRuleName: 'elb-acm-certificate-required',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(5)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_ACM_CERTIFICATE_REQUIRED',
    AwsConfigRuleName: 'elb-acm-certificate-required',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_CROSS_ZONE_LOAD_BALANCING_ENABLED',
    AwsConfigRuleName: 'elb-cross-zone-load-balancing-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_CROSS_ZONE_LOAD_BALANCING_ENABLED',
    AwsConfigRuleName: 'elb-cross-zone-load-balancing-enabled',
    'NIST-ID': 'CP-10|SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_CUSTOM_SECURITY_POLICY_SSL_CHECK',
    AwsConfigRuleName: 'elb-custom-security-policy-ssl-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_CUSTOM_SECURITY_POLICY_SSL_CHECK',
    AwsConfigRuleName: 'elb-custom-security-policy-ssl-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'elb-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'elb-deletion-protection-enabled',
    'NIST-ID': 'CM-2|CP-10',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_LOGGING_ENABLED',
    AwsConfigRuleName: 'elb-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_LOGGING_ENABLED',
    AwsConfigRuleName: 'elb-logging-enabled',
    'NIST-ID': 'AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_PREDEFINED_SECURITY_POLICY_SSL_CHECK',
    AwsConfigRuleName: 'elb-predefined-security-policy-ssl-check',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_PREDEFINED_SECURITY_POLICY_SSL_CHECK',
    AwsConfigRuleName: 'elb-predefined-security-policy-ssl-check',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_TLS_HTTPS_LISTENERS_ONLY',
    AwsConfigRuleName: 'elb-tls-https-listeners-only',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_TLS_HTTPS_LISTENERS_ONLY',
    AwsConfigRuleName: 'elb-tls-https-listeners-only',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_ACM_CERTIFICATE_REQUIRED',
    AwsConfigRuleName: 'elbv2-acm-certificate-required',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SC-23(5)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_ACM_CERTIFICATE_REQUIRED',
    AwsConfigRuleName: 'elbv2-acm-certificate-required',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SC-23(5)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_LISTENER_ENCRYPTION_IN_TRANSIT',
    AwsConfigRuleName: 'elbv2-listener-encryption-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_LISTENER_ENCRYPTION_IN_TRANSIT',
    AwsConfigRuleName: 'elbv2-listener-encryption-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_MULTIPLE_AZ',
    AwsConfigRuleName: 'elbv2-multiple-az',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_MULTIPLE_AZ',
    AwsConfigRuleName: 'elbv2-multiple-az',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_PREDEFINED_SECURITY_POLICY_SSL_CHECK',
    AwsConfigRuleName: 'elbv2-predefined-security-policy-ssl-check',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELBV2_PREDEFINED_SECURITY_POLICY_SSL_CHECK',
    AwsConfigRuleName: 'elbv2-predefined-security-policy-ssl-check',
    'NIST-ID':
      'AC-4|AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_BLOCK_PUBLIC_ACCESS',
    AwsConfigRuleName: 'emr-block-public-access',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_BLOCK_PUBLIC_ACCESS',
    AwsConfigRuleName: 'emr-block-public-access',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_KERBEROS_ENABLED',
    AwsConfigRuleName: 'emr-kerberos-enabled',
    'NIST-ID': 'AC-2|AC-3|AC-5|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_KERBEROS_ENABLED',
    AwsConfigRuleName: 'emr-kerberos-enabled',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_MASTER_NO_PUBLIC_IP',
    AwsConfigRuleName: 'emr-master-no-public-ip',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_MASTER_NO_PUBLIC_IP',
    AwsConfigRuleName: 'emr-master-no-public-ip',
    'NIST-ID': 'AC-4|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_SECURITY_CONFIGURATION_ENCRYPTION_REST',
    AwsConfigRuleName: 'emr-security-configuration-encryption-rest',
    'NIST-ID': 'CA-9(1)|CP-9(8)|SI-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_SECURITY_CONFIGURATION_ENCRYPTION_REST',
    AwsConfigRuleName: 'emr-security-configuration-encryption-rest',
    'NIST-ID': 'CA-9(1)|CP-9|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EMR_SECURITY_CONFIGURATION_ENCRYPTION_TRANSIT',
    AwsConfigRuleName: 'emr-security-configuration-encryption-transit',
    'NIST-ID': 'AC-4|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EMR_SECURITY_CONFIGURATION_ENCRYPTION_TRANSIT',
    AwsConfigRuleName: 'emr-security-configuration-encryption-transit',
    'NIST-ID': 'AC-4|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ENCRYPTED_VOLUMES',
    AwsConfigRuleName: 'encrypted-volumes',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ENCRYPTED_VOLUMES',
    AwsConfigRuleName: 'encrypted-volumes',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EVENT_DATA_STORE_CMK_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'event-data-store-cmk-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'EVENT_DATA_STORE_CMK_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'event-data-store-cmk-encryption-enabled',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'FSX_LUSTRE_COPY_TAGS_TO_BACKUPS',
    AwsConfigRuleName: 'fsx-lustre-copy-tags-to-backups',
    'NIST-ID': 'CM-8|CP-9',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'FSX_LUSTRE_COPY_TAGS_TO_BACKUPS',
    AwsConfigRuleName: 'fsx-lustre-copy-tags-to-backups',
    'NIST-ID': 'CM-8|CP-9',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'FSX_OPENZFS_COPY_TAGS_ENABLED',
    AwsConfigRuleName: 'fsx-openzfs-copy-tags-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'FSX_OPENZFS_COPY_TAGS_ENABLED',
    AwsConfigRuleName: 'fsx-openzfs-copy-tags-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'FSX_WINDOWS_AUDIT_LOG_CONFIGURED',
    AwsConfigRuleName: 'fsx-windows-audit-log-configured',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'FSX_WINDOWS_AUDIT_LOG_CONFIGURED',
    AwsConfigRuleName: 'fsx-windows-audit-log-configured',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLOBAL_ENDPOINT_EVENT_REPLICATION_ENABLED',
    AwsConfigRuleName: 'global-endpoint-event-replication-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLOBAL_ENDPOINT_EVENT_REPLICATION_ENABLED',
    AwsConfigRuleName: 'global-endpoint-event-replication-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLUE_JOB_LOGGING_ENABLED',
    AwsConfigRuleName: 'glue-job-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLUE_JOB_LOGGING_ENABLED',
    AwsConfigRuleName: 'glue-job-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLUE_ML_TRANSFORM_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'glue-ml-transform-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLUE_ML_TRANSFORM_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'glue-ml-transform-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLUE_SPARK_JOB_SUPPORTED_VERSION',
    AwsConfigRuleName: 'glue-spark-job-supported-version',
    'NIST-ID': 'CA-9(1)|CM-2|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GLUE_SPARK_JOB_SUPPORTED_VERSION',
    AwsConfigRuleName: 'glue-spark-job-supported-version',
    'NIST-ID': 'CA-9(1)|CM-2|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_EKS_PROTECTION_AUDIT_ENABLED',
    AwsConfigRuleName: 'guardduty-eks-protection-audit-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_EKS_PROTECTION_AUDIT_ENABLED',
    AwsConfigRuleName: 'guardduty-eks-protection-audit-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_ENABLED_CENTRALIZED',
    AwsConfigRuleName: 'guardduty-enabled-centralized',
    'NIST-ID':
      'AC-2(12)|AU-6(1)|AU-6(5)|CA-7|CM-8(3)|RA-3(4)|SA-8(19)|SA-8(21)|SA-8(25)|SA-11(1)|SA-11(6)|SA-15(2)|SA-15(8)|SC-5|SC-5(1)|SC-5(3)|SI-3(8)|SI-4|SI-4(1)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(13)|SI-4(22)|SI-4(25)|SI-20',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_ENABLED_CENTRALIZED',
    AwsConfigRuleName: 'guardduty-enabled-centralized',
    'NIST-ID':
      'AC-2(1)|AC-2(4)|AC-2(12)(a)|AC-2(g)|AC-17(1)|AU-6(1)|AU-6(3)|CA-7(a)|CA-7(b)|RA-5|SA-10|SI-4(1)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(16)|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_NON_ARCHIVED_FINDINGS',
    AwsConfigRuleName: 'guardduty-non-archived-findings',
    'NIST-ID': 'IR-4(1)|IR-6(1)|IR-7(1)|RA-5|SA-10|SI-4',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_NON_ARCHIVED_FINDINGS',
    AwsConfigRuleName: 'guardduty-non-archived-findings',
    'NIST-ID': 'IR-4(1)|IR-6(1)|IR-7(1)|RA-5|SA-10|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_CUSTOMER_POLICY_BLOCKED_KMS_ACTIONS',
    AwsConfigRuleName: 'iam-customer-policy-blocked-kms-actions',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)|AC-5|AC-6(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_CUSTOMER_POLICY_BLOCKED_KMS_ACTIONS',
    AwsConfigRuleName: 'iam-customer-policy-blocked-kms-actions',
    'NIST-ID': 'AC-2|AC-3|AC-5|AC-6(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_GROUP_HAS_USERS_CHECK',
    AwsConfigRuleName: 'iam-group-has-users-check',
    'NIST-ID': 'AC-2|AC-3|AC-5|AC-6|SC-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_GROUP_HAS_USERS_CHECK',
    AwsConfigRuleName: 'iam-group-has-users-check',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6|SC-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_INLINE_POLICY_BLOCKED_KMS_ACTIONS',
    AwsConfigRuleName: 'iam-inline-policy-blocked-kms-actions',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)|AC-5|AC-6(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_INLINE_POLICY_BLOCKED_KMS_ACTIONS',
    AwsConfigRuleName: 'iam-inline-policy-blocked-kms-actions',
    'NIST-ID': 'AC-2|AC-3|AC-5|AC-6(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_NO_INLINE_POLICY_CHECK',
    AwsConfigRuleName: 'iam-no-inline-policy-check',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)|AC-6(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_NO_INLINE_POLICY_CHECK',
    AwsConfigRuleName: 'iam-no-inline-policy-check',
    'NIST-ID': 'AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_PASSWORD_POLICY',
    AwsConfigRuleName: 'iam-password-policy',
    'NIST-ID': 'AC-3(15)|IA-5(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_PASSWORD_POLICY',
    AwsConfigRuleName: 'iam-password-policy',
    'NIST-ID':
      'AC-2(1)|AC-2(f)|AC-2(j)|IA-2|IA-5(1)(a)|IA-5(1)(d)|IA-5(1)(e)|IA-5(4)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS',
    AwsConfigRuleName: 'iam-policy-no-statements-with-admin-access',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)|AC-5|AC-6(2)|AC-6(3)|AC-6(10)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS',
    AwsConfigRuleName: 'iam-policy-no-statements-with-admin-access',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6|SC-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_POLICY_NO_STATEMENTS_WITH_FULL_ACCESS',
    AwsConfigRuleName: 'iam-policy-no-statements-with-full-access',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)|AC-5|AC-6(2)|AC-6(3)|AC-6(10)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_POLICY_NO_STATEMENTS_WITH_FULL_ACCESS',
    AwsConfigRuleName: 'iam-policy-no-statements-with-full-access',
    'NIST-ID': 'AC-2|AC-3|AC-5|AC-6(2)|AC-6(3)|AC-6(10)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_ROOT_ACCESS_KEY_CHECK',
    AwsConfigRuleName: 'iam-root-access-key-check',
    'NIST-ID': 'AC-3(15)|AC-6(2)|AC-6(10)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_ROOT_ACCESS_KEY_CHECK',
    AwsConfigRuleName: 'iam-root-access-key-check',
    'NIST-ID': 'AC-2(f)|AC-2(j)|AC-3|AC-6|AC-6(10)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_GROUP_MEMBERSHIP_CHECK',
    AwsConfigRuleName: 'iam-user-group-membership-check',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)|AC-6(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_GROUP_MEMBERSHIP_CHECK',
    AwsConfigRuleName: 'iam-user-group-membership-check',
    'NIST-ID': 'AC-2(1)|AC-2(j)|AC-3|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_MFA_ENABLED',
    AwsConfigRuleName: 'iam-user-mfa-enabled',
    'NIST-ID': 'AC-3(15)|IA-2(1)|IA-2(2)|IA-2(6)|IA-2(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_MFA_ENABLED',
    AwsConfigRuleName: 'iam-user-mfa-enabled',
    'NIST-ID': 'IA-2(1)|IA-2(2)|IA-2(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_NO_POLICIES_CHECK',
    AwsConfigRuleName: 'iam-user-no-policies-check',
    'NIST-ID': 'AC-2|AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6|AC-6(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_NO_POLICIES_CHECK',
    AwsConfigRuleName: 'iam-user-no-policies-check',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_UNUSED_CREDENTIALS_CHECK',
    AwsConfigRuleName: 'iam-user-unused-credentials-check',
    'NIST-ID': 'AC-2|AC-3|AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_UNUSED_CREDENTIALS_CHECK',
    AwsConfigRuleName: 'iam-user-unused-credentials-check',
    'NIST-ID': 'AC-2(1)|AC-2(3)|AC-2(f)|AC-3|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'IMAGEBUILDER_IMAGERECIPE_EBS_VOLUMES_ENCRYPTED',
    AwsConfigRuleName: 'imagebuilder-imagerecipe-ebs-volumes-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'IMAGEBUILDER_IMAGERECIPE_EBS_VOLUMES_ENCRYPTED',
    AwsConfigRuleName: 'imagebuilder-imagerecipe-ebs-volumes-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'INTERNET_GATEWAY_AUTHORIZED_VPC_ONLY',
    AwsConfigRuleName: 'internet-gateway-authorized-vpc-only',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'INTERNET_GATEWAY_AUTHORIZED_VPC_ONLY',
    AwsConfigRuleName: 'internet-gateway-authorized-vpc-only',
    'NIST-ID': 'AC-4|AC-17(3)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'KINESIS_FIREHOSE_DELIVERY_STREAM_ENCRYPTED',
    AwsConfigRuleName: 'kinesis-firehose-delivery-stream-encrypted',
    'NIST-ID': 'AC-3|AU-3|SC-12|SC-13|SC-28',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'KINESIS_FIREHOSE_DELIVERY_STREAM_ENCRYPTED',
    AwsConfigRuleName: 'kinesis-firehose-delivery-stream-encrypted',
    'NIST-ID': 'AC-3|AU-3|SC-12|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'KINESIS_STREAM_ENCRYPTED',
    AwsConfigRuleName: 'kinesis-stream-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'KINESIS_STREAM_ENCRYPTED',
    AwsConfigRuleName: 'kinesis-stream-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'KMS_CMK_NOT_SCHEDULED_FOR_DELETION',
    AwsConfigRuleName: 'kms-cmk-not-scheduled-for-deletion',
    'NIST-ID': 'SC-12|SC-12(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'KMS_CMK_NOT_SCHEDULED_FOR_DELETION',
    AwsConfigRuleName: 'kms-cmk-not-scheduled-for-deletion',
    'NIST-ID': 'SC-12|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'KMS_KEY_POLICY_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'kms-key-policy-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|CA-9(1)|CM-3(6)|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'KMS_KEY_POLICY_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'kms-key-policy-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|CA-9(1)|CM-3(6)|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_DLQ_CHECK',
    AwsConfigRuleName: 'lambda-dlq-check',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_DLQ_CHECK',
    AwsConfigRuleName: 'lambda-dlq-check',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 'lambda-function-public-access-prohibited',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 'lambda-function-public-access-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_SETTINGS_CHECK',
    AwsConfigRuleName: 'lambda-function-settings-check',
    'NIST-ID': 'CA-9(1)|CM-2|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_SETTINGS_CHECK',
    AwsConfigRuleName: 'lambda-function-settings-check',
    'NIST-ID': 'CA-9(1)|CM-2|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_XRAY_ENABLED',
    AwsConfigRuleName: 'lambda-function-xray-enabled',
    'NIST-ID': 'CA-7',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_XRAY_ENABLED',
    AwsConfigRuleName: 'lambda-function-xray-enabled',
    'NIST-ID': 'CA-7',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_INSIDE_VPC',
    AwsConfigRuleName: 'lambda-inside-vpc',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_INSIDE_VPC',
    AwsConfigRuleName: 'lambda-inside-vpc',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_VPC_MULTI_AZ_CHECK',
    AwsConfigRuleName: 'lambda-vpc-multi-az-check',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_VPC_MULTI_AZ_CHECK',
    AwsConfigRuleName: 'lambda-vpc-multi-az-check',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'LIGHTSAIL_BUCKET_ALLOW_PUBLIC_OVERRIDES_DISABLED',
    AwsConfigRuleName: 'lightsail-bucket-allow-public-overrides-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'LIGHTSAIL_BUCKET_ALLOW_PUBLIC_OVERRIDES_DISABLED',
    AwsConfigRuleName: 'lightsail-bucket-allow-public-overrides-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MACIE_AUTO_SENSITIVE_DATA_DISCOVERY_CHECK',
    AwsConfigRuleName: 'macie-auto-sensitive-data-discovery-check',
    'NIST-ID': 'CA-7|CA-9(1)|RA-5|SA-8(19)|SI-4',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MACIE_AUTO_SENSITIVE_DATA_DISCOVERY_CHECK',
    AwsConfigRuleName: 'macie-auto-sensitive-data-discovery-check',
    'NIST-ID': 'CA-7|CA-9(1)|RA-5|SA-8|SI-4',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MACIE_STATUS_CHECK',
    AwsConfigRuleName: 'macie-status-check',
    'NIST-ID': 'CA-7|CA-9(1)|RA-5|SA-8(19)|SI-4',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MACIE_STATUS_CHECK',
    AwsConfigRuleName: 'macie-status-check',
    'NIST-ID': 'CA-7|CA-9(1)|RA-5|SA-8|SI-4',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MARIADB_PUBLISH_LOGS_TO_CLOUDWATCH_LOGS',
    AwsConfigRuleName: 'mariadb-publish-logs-to-cloudwatch-logs',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MARIADB_PUBLISH_LOGS_TO_CLOUDWATCH_LOGS',
    AwsConfigRuleName: 'mariadb-publish-logs-to-cloudwatch-logs',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
    AwsConfigRuleName: 'mfa-enabled-for-iam-console-access',
    'NIST-ID': 'AC-3(15)|IA-2(1)|IA-2(2)|IA-2(6)|IA-2(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
    AwsConfigRuleName: 'mfa-enabled-for-iam-console-access',
    'NIST-ID': 'IA-2(1)|IA-2(2)|IA-2(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_ACTIVE_DEPLOYMENT_MODE',
    AwsConfigRuleName: 'mq-active-deployment-mode',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_ACTIVE_DEPLOYMENT_MODE',
    AwsConfigRuleName: 'mq-active-deployment-mode',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_BROKER_GENERAL_LOGGING_ENABLED',
    AwsConfigRuleName: 'mq-broker-general-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_BROKER_GENERAL_LOGGING_ENABLED',
    AwsConfigRuleName: 'mq-broker-general-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_CLOUDWATCH_AUDIT_LOG_ENABLED',
    AwsConfigRuleName: 'mq-cloudwatch-audit-log-enabled',
    'NIST-ID': 'AU-2|AU-3|AU-12|SI-4',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_CLOUDWATCH_AUDIT_LOG_ENABLED',
    AwsConfigRuleName: 'mq-cloudwatch-audit-log-enabled',
    'NIST-ID': 'AU-2|AU-3|AU-12|SI-4',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_CLOUDWATCH_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'mq-cloudwatch-audit-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_CLOUDWATCH_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'mq-cloudwatch-audit-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'mq-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'mq-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_RABBIT_DEPLOYMENT_MODE',
    AwsConfigRuleName: 'mq-rabbit-deployment-mode',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MQ_RABBIT_DEPLOYMENT_MODE',
    AwsConfigRuleName: 'mq-rabbit-deployment-mode',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_CLUSTER_PUBLIC_ACCESS_DISABLED',
    AwsConfigRuleName: 'msk-cluster-public-access-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_CLUSTER_PUBLIC_ACCESS_DISABLED',
    AwsConfigRuleName: 'msk-cluster-public-access-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_CONNECT_CONNECTOR_LOGGING_ENABLED',
    AwsConfigRuleName: 'msk-connect-connector-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_CONNECT_CONNECTOR_LOGGING_ENABLED',
    AwsConfigRuleName: 'msk-connect-connector-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_ENHANCED_MONITORING_ENABLED',
    AwsConfigRuleName: 'msk-enhanced-monitoring-enabled',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_ENHANCED_MONITORING_ENABLED',
    AwsConfigRuleName: 'msk-enhanced-monitoring-enabled',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_IN_CLUSTER_NODE_REQUIRE_TLS',
    AwsConfigRuleName: 'msk-in-cluster-node-require-tls',
    'NIST-ID': 'AC-4|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MSK_IN_CLUSTER_NODE_REQUIRE_TLS',
    AwsConfigRuleName: 'msk-in-cluster-node-require-tls',
    'NIST-ID': 'AC-4|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MULTI_REGION_CLOUD_TRAIL_ENABLED',
    AwsConfigRuleName: 'multi-region-cloudtrail-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'MULTI_REGION_CLOUD_TRAIL_ENABLED',
    AwsConfigRuleName: 'multi-region-cloudtrail-enabled',
    'NIST-ID': 'AC-2(4)|AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NACL_NO_UNRESTRICTED_SSH_RDP',
    AwsConfigRuleName: 'nacl-no-unrestricted-ssh-rdp',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2|CM-2(2)|CM-7|SC-7|SC-7(5)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NACL_NO_UNRESTRICTED_SSH_RDP',
    AwsConfigRuleName: 'nacl-no-unrestricted-ssh-rdp',
    'NIST-ID': 'AC-4(21)|CA-9(1)|CM-2|CM-2(2)|CM-7|SC-7|SC-7(5)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_BACKUP_RETENTION_CHECK',
    AwsConfigRuleName: 'neptune-cluster-backup-retention-check',
    'NIST-ID': 'SI-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_BACKUP_RETENTION_CHECK',
    AwsConfigRuleName: 'neptune-cluster-backup-retention-check',
    'NIST-ID': 'SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_CLOUDWATCH_LOG_EXPORT_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-cloudwatch-log-export-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(1)|AU-6(3)|AU-6(4)|AU-6(5)|AU-7(1)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(5)|SI-4(20)|SI-7(8)|SI-20',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_CLOUDWATCH_LOG_EXPORT_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-cloudwatch-log-export-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(1)|AU-6(3)|AU-6(4)|AU-6(5)|AU-7(1)|AU-9|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(5)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_COPY_TAGS_TO_SNAPSHOT_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-copy-tags-to-snapshot-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_COPY_TAGS_TO_SNAPSHOT_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-copy-tags-to-snapshot-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_ENCRYPTED',
    AwsConfigRuleName: 'neptune-cluster-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_ENCRYPTED',
    AwsConfigRuleName: 'neptune-cluster-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_IAM_DATABASE_AUTHENTICATION',
    AwsConfigRuleName: 'neptune-cluster-iam-database-authentication',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NEPTUNE_CLUSTER_IAM_DATABASE_AUTHENTICATION',
    AwsConfigRuleName: 'neptune-cluster-iam-database-authentication',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_MULTI_AZ_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-multi-az-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_MULTI_AZ_ENABLED',
    AwsConfigRuleName: 'neptune-cluster-multi-az-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_SNAPSHOT_ENCRYPTED',
    AwsConfigRuleName: 'neptune-cluster-snapshot-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-7(18)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_SNAPSHOT_ENCRYPTED',
    AwsConfigRuleName: 'neptune-cluster-snapshot-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-7(18)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_SNAPSHOT_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'neptune-cluster-snapshot-public-prohibited',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NEPTUNE_CLUSTER_SNAPSHOT_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'neptune-cluster-snapshot-public-prohibited',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'netfw-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'netfw-deletion-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_LOGGING_ENABLED',
    AwsConfigRuleName: 'netfw-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_LOGGING_ENABLED',
    AwsConfigRuleName: 'netfw-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_MULTI_AZ_ENABLED',
    AwsConfigRuleName: 'netfw-multi-az-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_MULTI_AZ_ENABLED',
    AwsConfigRuleName: 'netfw-multi-az-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NETFW_POLICY_DEFAULT_ACTION_FRAGMENT_PACKETS',
    AwsConfigRuleName: 'netfw-policy-default-action-fragment-packets',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'NETFW_POLICY_DEFAULT_ACTION_FRAGMENT_PACKETS',
    AwsConfigRuleName: 'netfw-policy-default-action-fragment-packets',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_POLICY_DEFAULT_ACTION_FULL_PACKETS',
    AwsConfigRuleName: 'netfw-policy-default-action-full-packets',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_POLICY_DEFAULT_ACTION_FULL_PACKETS',
    AwsConfigRuleName: 'netfw-policy-default-action-full-packets',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_POLICY_RULE_GROUP_ASSOCIATED',
    AwsConfigRuleName: 'netfw-policy-rule-group-associated',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_POLICY_RULE_GROUP_ASSOCIATED',
    AwsConfigRuleName: 'netfw-policy-rule-group-associated',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_STATELESS_RULE_GROUP_NOT_EMPTY',
    AwsConfigRuleName: 'netfw-stateless-rule-group-not-empty',
    'NIST-ID': 'AC-4(21)|SC-7|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_STATELESS_RULE_GROUP_NOT_EMPTY',
    AwsConfigRuleName: 'netfw-stateless-rule-group-not-empty',
    'NIST-ID': 'AC-4(21)|SC-7|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_SUBNET_CHANGE_PROTECTION_ENABLED',
    AwsConfigRuleName: 'netfw-subnet-change-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NETFW_SUBNET_CHANGE_PROTECTION_ENABLED',
    AwsConfigRuleName: 'netfw-subnet-change-protection-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NLB_LOGGING_ENABLED',
    AwsConfigRuleName: 'nlb-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NLB_LOGGING_ENABLED',
    AwsConfigRuleName: 'nlb-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'NO_UNRESTRICTED_ROUTE_TO_IGW',
    AwsConfigRuleName: 'no-unrestricted-route-to-igw',
    'NIST-ID': 'CM-7|SC-7|SC-7(4)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'NO_UNRESTRICTED_ROUTE_TO_IGW',
    AwsConfigRuleName: 'no-unrestricted-route-to-igw',
    'NIST-ID': 'CM-7|SC-7|SC-7(4)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_ACCESS_CONTROL_ENABLED',
    AwsConfigRuleName: 'opensearch-access-control-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-5|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_ACCESS_CONTROL_ENABLED',
    AwsConfigRuleName: 'opensearch-access-control-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-5|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'opensearch-audit-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'opensearch-audit-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_DATA_NODE_FAULT_TOLERANCE',
    AwsConfigRuleName: 'opensearch-data-node-fault-tolerance',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_DATA_NODE_FAULT_TOLERANCE',
    AwsConfigRuleName: 'opensearch-data-node-fault-tolerance',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'opensearch-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'opensearch-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_HTTPS_REQUIRED',
    AwsConfigRuleName: 'opensearch-https-required',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_HTTPS_REQUIRED',
    AwsConfigRuleName: 'opensearch-https-required',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_IN_VPC_ONLY',
    AwsConfigRuleName: 'opensearch-in-vpc-only',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_IN_VPC_ONLY',
    AwsConfigRuleName: 'opensearch-in-vpc-only',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'opensearch-logs-to-cloudwatch',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'opensearch-logs-to-cloudwatch',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_NODE_TO_NODE_ENCRYPTION_CHECK',
    AwsConfigRuleName: 'opensearch-node-to-node-encryption-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_NODE_TO_NODE_ENCRYPTION_CHECK',
    AwsConfigRuleName: 'opensearch-node-to-node-encryption-check',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_PRIMARY_NODE_FAULT_TOLERANCE',
    AwsConfigRuleName: 'opensearch-primary-node-fault-tolerance',
    'NIST-ID': 'CP-2|CP-10|SC-5|SC-36|SI-13',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_PRIMARY_NODE_FAULT_TOLERANCE',
    AwsConfigRuleName: 'opensearch-primary-node-fault-tolerance',
    'NIST-ID': 'CP-2|CP-10|SC-5|SC-36|SI-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_UPDATE_CHECK',
    AwsConfigRuleName: 'opensearch-update-check',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'OPENSEARCH_UPDATE_CHECK',
    AwsConfigRuleName: 'opensearch-update-check',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_AURORA_MYSQL_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'rds-aurora-mysql-audit-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_AURORA_MYSQL_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'rds-aurora-mysql-audit-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_AURORA_POSTGRESQL_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'rds-aurora-postgresql-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_AURORA_POSTGRESQL_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'rds-aurora-postgresql-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'RDS_AUTOMATIC_MINOR_VERSION_UPGRADE_ENABLED',
    AwsConfigRuleName: 'rds-automatic-minor-version-upgrade-enabled',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'RDS_AUTOMATIC_MINOR_VERSION_UPGRADE_ENABLED',
    AwsConfigRuleName: 'rds-automatic-minor-version-upgrade-enabled',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'RDS_CLUSTER_AUTO_MINOR_VERSION_UPGRADE_ENABLE',
    AwsConfigRuleName: 'rds-cluster-auto-minor-version-upgrade-enable',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'RDS_CLUSTER_AUTO_MINOR_VERSION_UPGRADE_ENABLE',
    AwsConfigRuleName: 'rds-cluster-auto-minor-version-upgrade-enable',
    'NIST-ID': 'SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_DEFAULT_ADMIN_CHECK',
    AwsConfigRuleName: 'rds-cluster-default-admin-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_DEFAULT_ADMIN_CHECK',
    AwsConfigRuleName: 'rds-cluster-default-admin-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'rds-cluster-deletion-protection-enabled',
    'NIST-ID': 'CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'rds-cluster-deletion-protection-enabled',
    'NIST-ID': 'CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'rds-cluster-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'rds-cluster-encrypted-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_IAM_AUTHENTICATION_ENABLED',
    AwsConfigRuleName: 'rds-cluster-iam-authentication-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_IAM_AUTHENTICATION_ENABLED',
    AwsConfigRuleName: 'rds-cluster-iam-authentication-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_MULTI_AZ_ENABLED',
    AwsConfigRuleName: 'rds-cluster-multi-az-enabled',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_CLUSTER_MULTI_AZ_ENABLED',
    AwsConfigRuleName: 'rds-cluster-multi-az-enabled',
    'NIST-ID': 'CP-10|SC-5|SC-36',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_ENHANCED_MONITORING_ENABLED',
    AwsConfigRuleName: 'rds-enhanced-monitoring-enabled',
    'NIST-ID': 'CA-7|SI-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_ENHANCED_MONITORING_ENABLED',
    AwsConfigRuleName: 'rds-enhanced-monitoring-enabled',
    'NIST-ID': 'CA-7(a)|CA-7(b)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'rds-in-backup-plan',
    'NIST-ID': 'CP-9|CP-10|SI-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'rds-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_DEFAULT_ADMIN_CHECK',
    AwsConfigRuleName: 'rds-instance-default-admin-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_DEFAULT_ADMIN_CHECK',
    AwsConfigRuleName: 'rds-instance-default-admin-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'rds-instance-deletion-protection-enabled',
    'NIST-ID': 'CM-3|SC-5(2)|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'rds-instance-deletion-protection-enabled',
    'NIST-ID': 'SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_IAM_AUTHENTICATION_ENABLED',
    AwsConfigRuleName: 'rds-instance-iam-authentication-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_IAM_AUTHENTICATION_ENABLED',
    AwsConfigRuleName: 'rds-instance-iam-authentication-enabled',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK',
    AwsConfigRuleName: 'rds-instance-public-access-check',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK',
    AwsConfigRuleName: 'rds-instance-public-access-check',
    'NIST-ID': 'AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_LOGGING_ENABLED',
    AwsConfigRuleName: 'rds-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_LOGGING_ENABLED',
    AwsConfigRuleName: 'rds-logging-enabled',
    'NIST-ID': 'AC-2(4)|AC-2(g)|AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MARIADB_INSTANCE_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-mariadb-instance-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MARIADB_INSTANCE_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-mariadb-instance-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MULTI_AZ_SUPPORT',
    AwsConfigRuleName: 'rds-multi-az-support',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MULTI_AZ_SUPPORT',
    AwsConfigRuleName: 'rds-multi-az-support',
    'NIST-ID': 'CP-10|SC-5|SC-36',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MYSQL_INSTANCE_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-mysql-instance-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MYSQL_INSTANCE_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-mysql-instance-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_POSTGRES_INSTANCE_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-postgres-instance-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_POSTGRES_INSTANCE_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-postgres-instance-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_POSTGRESQL_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'rds-postgresql-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_POSTGRESQL_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'rds-postgresql-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_PROXY_TLS_ENCRYPTION',
    AwsConfigRuleName: 'rds-proxy-tls-encryption',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_PROXY_TLS_ENCRYPTION',
    AwsConfigRuleName: 'rds-proxy-tls-encryption',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
    AwsConfigRuleName: 'rds-resources-protected-by-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_RESOURCES_PROTECTED_BY_BACKUP_PLAN',
    AwsConfigRuleName: 'rds-resources-protected-by-backup-plan',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SNAPSHOT_ENCRYPTED',
    AwsConfigRuleName: 'rds-snapshot-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SNAPSHOT_ENCRYPTED',
    AwsConfigRuleName: 'rds-snapshot-encrypted',
    'NIST-ID': 'SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SNAPSHOTS_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'rds-snapshots-public-prohibited',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SNAPSHOTS_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'rds-snapshots-public-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SQL_SERVER_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'rds-sql-server-logs-to-cloudwatch',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SQL_SERVER_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'rds-sql-server-logs-to-cloudwatch',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SQLSERVER_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-sqlserver-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SQLSERVER_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'rds-sqlserver-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
    AwsConfigRuleName: 'rds-storage-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
    AwsConfigRuleName: 'rds-storage-encrypted',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'redshift-audit-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_AUDIT_LOGGING_ENABLED',
    AwsConfigRuleName: 'redshift-audit-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_BACKUP_ENABLED',
    AwsConfigRuleName: 'redshift-backup-enabled',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SC-7(10)|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_BACKUP_ENABLED',
    AwsConfigRuleName: 'redshift-backup-enabled',
    'NIST-ID': 'CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SC-7(10)|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_CONFIGURATION_CHECK',
    AwsConfigRuleName: 'redshift-cluster-configuration-check',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|CA-9(1)|CM-3(6)|SC-7(9)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-3(8)|SI-4(20)|SI-7(6)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_CONFIGURATION_CHECK',
    AwsConfigRuleName: 'redshift-cluster-configuration-check',
    'NIST-ID':
      'AC-2(4)|AC-2(g)|AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_KMS_ENABLED',
    AwsConfigRuleName: 'redshift-cluster-kms-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_KMS_ENABLED',
    AwsConfigRuleName: 'redshift-cluster-kms-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_MAINTENANCESETTINGS_CHECK',
    AwsConfigRuleName: 'redshift-cluster-maintenancesettings-check',
    'NIST-ID': 'CA-9(1)|CM-2|CP-9|SC-5(2)|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_MAINTENANCESETTINGS_CHECK',
    AwsConfigRuleName: 'redshift-cluster-maintenancesettings-check',
    'NIST-ID': 'CA-9(1)|CM-2|CP-9|SC-5(2)|SI-2|SI-2(2)|SI-2(4)|SI-2(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_PUBLIC_ACCESS_CHECK',
    AwsConfigRuleName: 'redshift-cluster-public-access-check',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_PUBLIC_ACCESS_CHECK',
    AwsConfigRuleName: 'redshift-cluster-public-access-check',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_DEFAULT_ADMIN_CHECK',
    AwsConfigRuleName: 'redshift-default-admin-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_DEFAULT_ADMIN_CHECK',
    AwsConfigRuleName: 'redshift-default-admin-check',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_ENHANCED_VPC_ROUTING_ENABLED',
    AwsConfigRuleName: 'redshift-enhanced-vpc-routing-enabled',
    'NIST-ID': 'SC-7|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_ENHANCED_VPC_ROUTING_ENABLED',
    AwsConfigRuleName: 'redshift-enhanced-vpc-routing-enabled',
    'NIST-ID': 'SC-7|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_REQUIRE_TLS_SSL',
    AwsConfigRuleName: 'redshift-require-tls-ssl',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_REQUIRE_TLS_SSL',
    AwsConfigRuleName: 'redshift-require-tls-ssl',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_NAMESPACE_CMK_ENCRYPTION',
    AwsConfigRuleName: 'redshift-serverless-namespace-cmk-encryption',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_NAMESPACE_CMK_ENCRYPTION',
    AwsConfigRuleName: 'redshift-serverless-namespace-cmk-encryption',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_PUBLISH_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'redshift-serverless-publish-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_PUBLISH_LOGS_TO_CLOUDWATCH',
    AwsConfigRuleName: 'redshift-serverless-publish-logs-to-cloudwatch',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_WORKGROUP_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'redshift-serverless-workgroup-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_WORKGROUP_ENCRYPTED_IN_TRANSIT',
    AwsConfigRuleName: 'redshift-serverless-workgroup-encrypted-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_WORKGROUP_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'redshift-serverless-workgroup-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'REDSHIFT_SERVERLESS_WORKGROUP_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'redshift-serverless-workgroup-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RESTRICTED_INCOMING_TRAFFIC',
    AwsConfigRuleName: 'restricted-common-ports',
    'NIST-ID':
      'CA-9(1)|CM-2|CM-2(2)|CM-7|SC-7|SC-7(4)|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RESTRICTED_INCOMING_TRAFFIC',
    AwsConfigRuleName: 'restricted-common-ports',
    'NIST-ID': 'AC-4|CM-2|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'INCOMING_SSH_DISABLED',
    AwsConfigRuleName: 'restricted-ssh',
    'NIST-ID': 'CM-7|SC-7|SC-7(4)|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'INCOMING_SSH_DISABLED',
    AwsConfigRuleName: 'restricted-ssh',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROOT_ACCOUNT_HARDWARE_MFA_ENABLED',
    AwsConfigRuleName: 'root-account-hardware-mfa-enabled',
    'NIST-ID': 'AC-3(15)|IA-2(1)|IA-2(2)|IA-2(6)|IA-2(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROOT_ACCOUNT_HARDWARE_MFA_ENABLED',
    AwsConfigRuleName: 'root-account-hardware-mfa-enabled',
    'NIST-ID': 'IA-2(1)|IA-2(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROOT_ACCOUNT_MFA_ENABLED',
    AwsConfigRuleName: 'root-account-mfa-enabled',
    'NIST-ID': 'AC-3(15)|IA-2(1)|IA-2(2)|IA-2(6)|IA-2(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROOT_ACCOUNT_MFA_ENABLED',
    AwsConfigRuleName: 'root-account-mfa-enabled',
    'NIST-ID': 'AC-2(j)|IA-2(1)|IA-2(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROUTE53_QUERY_LOGGING_ENABLED',
    AwsConfigRuleName: 'route53-query-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROUTE53_QUERY_LOGGING_ENABLED',
    AwsConfigRuleName: 'route53-query-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RUM_APP_MONITOR_CLOUDWATCH_LOGS_ENABLED',
    AwsConfigRuleName: 'rum-app-monitor-cloudwatch-logs-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'RUM_APP_MONITOR_CLOUDWATCH_LOGS_ENABLED',
    AwsConfigRuleName: 'rum-app-monitor-cloudwatch-logs-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_ACCESS_POINT_PUBLIC_ACCESS_BLOCKS',
    AwsConfigRuleName: 's3-access-point-public-access-blocks',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_ACCESS_POINT_PUBLIC_ACCESS_BLOCKS',
    AwsConfigRuleName: 's3-access-point-public-access-blocks',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS',
    AwsConfigRuleName: 's3-account-level-public-access-blocks',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS',
    AwsConfigRuleName: 's3-account-level-public-access-blocks',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS_PERIODIC',
    AwsConfigRuleName: 's3-account-level-public-access-blocks-periodic',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS_PERIODIC',
    AwsConfigRuleName: 's3-account-level-public-access-blocks-periodic',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_ACL_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-acl-prohibited',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-3(15)|AC-6',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_ACL_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-acl-prohibited',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_DEFAULT_LOCK_ENABLED',
    AwsConfigRuleName: 's3-bucket-default-lock-enabled',
    'NIST-ID': 'CP-6(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_DEFAULT_LOCK_ENABLED',
    AwsConfigRuleName: 's3-bucket-default-lock-enabled',
    'NIST-ID': 'SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-level-public-access-prohibited',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-level-public-access-prohibited',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_LOGGING_ENABLED',
    AwsConfigRuleName: 's3-bucket-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_LOGGING_ENABLED',
    AwsConfigRuleName: 's3-bucket-logging-enabled',
    'NIST-ID': 'AC-2(g)|AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_MFA_DELETE_ENABLED',
    AwsConfigRuleName: 's3-bucket-mfa-delete-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_MFA_DELETE_ENABLED',
    AwsConfigRuleName: 's3-bucket-mfa-delete-enabled',
    'NIST-ID': 'CA-9(1)|CM-2|CM-2(2)|CM-3|SC-5(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_POLICY_GRANTEE_CHECK',
    AwsConfigRuleName: 's3-bucket-policy-grantee-check',
    'NIST-ID': 'AC-3|AC-6|SC-7|SC-7(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_POLICY_GRANTEE_CHECK',
    AwsConfigRuleName: 's3-bucket-policy-grantee-check',
    'NIST-ID': 'AC-3|AC-6|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-public-read-prohibited',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-public-read-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-public-write-prohibited',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-public-write-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_REPLICATION_ENABLED',
    AwsConfigRuleName: 's3-bucket-replication-enabled',
    'NIST-ID':
      'AU-9(2)|CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SC-36(2)|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_REPLICATION_ENABLED',
    AwsConfigRuleName: 's3-bucket-replication-enabled',
    'NIST-ID': 'AU-9(2)|CP-9(b)|CP-10|SC-5|SC-36',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 's3-bucket-server-side-encryption-enabled',
    'NIST-ID': 'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 's3-bucket-server-side-encryption-enabled',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
    AwsConfigRuleName: 's3-bucket-ssl-requests-only',
    'NIST-ID':
      'AC-17(2)|IA-5(1)|SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-12(3)|SC-13|SC-23|SC-23(3)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
    AwsConfigRuleName: 's3-bucket-ssl-requests-only',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
    AwsConfigRuleName: 's3-bucket-versioning-enabled',
    'NIST-ID': 'AU-9(2)|CP-6|CP-6(1)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-12|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
    AwsConfigRuleName: 's3-bucket-versioning-enabled',
    'NIST-ID': 'CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_DEFAULT_ENCRYPTION_KMS',
    AwsConfigRuleName: 's3-default-encryption-kms',
    'NIST-ID': 'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_DEFAULT_ENCRYPTION_KMS',
    AwsConfigRuleName: 's3-default-encryption-kms',
    'NIST-ID': 'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_EVENT_NOTIFICATIONS_ENABLED',
    AwsConfigRuleName: 's3-event-notifications-enabled',
    'NIST-ID': 'CA-7|SI-3(8)|SI-4|SI-4(4)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_EVENT_NOTIFICATIONS_ENABLED',
    AwsConfigRuleName: 's3-event-notifications-enabled',
    'NIST-ID': 'CA-7|SI-3(8)|SI-4|SI-4(4)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_LIFECYCLE_POLICY_CHECK',
    AwsConfigRuleName: 's3-lifecycle-policy-check',
    'NIST-ID': 'CP-6(2)|CP-9|CP-10|SC-5(2)|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_LIFECYCLE_POLICY_CHECK',
    AwsConfigRuleName: 's3-lifecycle-policy-check',
    'NIST-ID': 'CP-6(2)|CP-9|CP-10|SC-5(2)|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_VERSION_LIFECYCLE_POLICY_CHECK',
    AwsConfigRuleName: 's3-version-lifecycle-policy-check',
    'NIST-ID': 'AU-9(2)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_VERSION_LIFECYCLE_POLICY_CHECK',
    AwsConfigRuleName: 's3-version-lifecycle-policy-check',
    'NIST-ID': 'AU-9(2)|CP-6(2)|CP-9|CP-10|SC-5(2)|SI-13(5)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_DATA_QUALITY_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-data-quality-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_DATA_QUALITY_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-data-quality-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SAGEMAKER_ENDPOINT_CONFIG_KMS_KEY_REQUIRED',
    AwsConfigRuleName: 'sagemaker-endpoint-config-kms-key-required',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SAGEMAKER_ENDPOINT_CONFIG_KMS_KEY_REQUIRED',
    AwsConfigRuleName: 'sagemaker-endpoint-config-kms-key-required',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_ENDPOINT_CONFIG_PROD_INSTANCE_COUNT',
    AwsConfigRuleName: 'sagemaker-endpoint-config-prod-instance-count',
    'NIST-ID': 'CP-10|SA-13|SC-5|SC-36',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_ENDPOINT_CONFIG_PROD_INSTANCE_COUNT',
    AwsConfigRuleName: 'sagemaker-endpoint-config-prod-instance-count',
    'NIST-ID': 'CP-10|SA-13|SC-5|SC-36',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_ENDPOINT_CONFIGURATION_KMS_KEY_CONFIGURED',
    AwsConfigRuleName: 'sagemaker-endpoint-configuration-kms-key-configured',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_ENDPOINT_CONFIGURATION_KMS_KEY_CONFIGURED',
    AwsConfigRuleName: 'sagemaker-endpoint-configuration-kms-key-configured',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SAGEMAKER_FEATUREGROUP_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'sagemaker-featuregroup-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SAGEMAKER_FEATUREGROUP_ENCRYPTION_AT_REST',
    AwsConfigRuleName: 'sagemaker-featuregroup-encryption-at-rest',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_FEATUREGROUP_ONLINE_STORE_ENCRYPTION',
    AwsConfigRuleName: 'sagemaker-featuregroup-online-store-encryption',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_FEATUREGROUP_ONLINE_STORE_ENCRYPTION',
    AwsConfigRuleName: 'sagemaker-featuregroup-online-store-encryption',
    'NIST-ID':
      'AU-9|CA-9(1)|CM-3(6)|SC-7(10)|SC-12(2)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_INF_EXPERIMENT_DATA_STORAGE_KMS_ENCRYPTED',
    AwsConfigRuleName: 'sagemaker-inf-experiment-data-storage-kms-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_INF_EXPERIMENT_DATA_STORAGE_KMS_ENCRYPTED',
    AwsConfigRuleName: 'sagemaker-inf-experiment-data-storage-kms-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_INF_EXPERIMENT_INSTANCE_STORAGE_KMS_ENCRYPTED',
    AwsConfigRuleName:
      'sagemaker-inf-experiment-instance-storage-kms-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_INF_EXPERIMENT_INSTANCE_STORAGE_KMS_ENCRYPTED',
    AwsConfigRuleName:
      'sagemaker-inf-experiment-instance-storage-kms-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_MODEL_BIAS_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-model-bias-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_MODEL_BIAS_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-model-bias-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_MODEL_EXPLAINABILITY_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-model-explainability-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_MODEL_EXPLAINABILITY_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-model-explainability-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_MODEL_QUALITY_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-model-quality-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_MODEL_QUALITY_JOB_ENCRYPT_IN_TRANSIT',
    AwsConfigRuleName: 'sagemaker-model-quality-job-encrypt-in-transit',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SAGEMAKER_NOTEBOOK_INSTANCE_INSIDE_VPC',
    AwsConfigRuleName: 'sagemaker-notebook-instance-inside-vpc',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SAGEMAKER_NOTEBOOK_INSTANCE_INSIDE_VPC',
    AwsConfigRuleName: 'sagemaker-notebook-instance-inside-vpc',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_KMS_KEY_CONFIGURED',
    AwsConfigRuleName: 'sagemaker-notebook-instance-kms-key-configured',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_KMS_KEY_CONFIGURED',
    AwsConfigRuleName: 'sagemaker-notebook-instance-kms-key-configured',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_ROOT_ACCESS_CHECK',
    AwsConfigRuleName: 'sagemaker-notebook-instance-root-access-check',
    'NIST-ID': 'AC-2(1)|AC-3(7)|AC-3(15)|AC-6|AC-6(2)|AC-6(10)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_ROOT_ACCESS_CHECK',
    AwsConfigRuleName: 'sagemaker-notebook-instance-root-access-check',
    'NIST-ID': 'AC-2(1)|AC-3|AC-3(7)|AC-6|AC-6(2)|AC-6(10)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_STORAGE_VOL_KMS_ENCRYPTED',
    AwsConfigRuleName: 'sagemaker-notebook-instance-storage-vol-kms-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_STORAGE_VOL_KMS_ENCRYPTED',
    AwsConfigRuleName: 'sagemaker-notebook-instance-storage-vol-kms-encrypted',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_NO_DIRECT_INTERNET_ACCESS',
    AwsConfigRuleName: 'sagemaker-notebook-no-direct-internet-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_NO_DIRECT_INTERNET_ACCESS',
    AwsConfigRuleName: 'sagemaker-notebook-no-direct-internet-access',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_ROTATION_ENABLED_CHECK',
    AwsConfigRuleName: 'secretsmanager-rotation-enabled-check',
    'NIST-ID': 'AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_ROTATION_ENABLED_CHECK',
    AwsConfigRuleName: 'secretsmanager-rotation-enabled-check',
    'NIST-ID': 'AC-3',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SECRETSMANAGER_SCHEDULED_ROTATION_SUCCESS_CHECK',
    AwsConfigRuleName: 'secretsmanager-scheduled-rotation-success-check',
    'NIST-ID': 'AC-2(1)|AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SECRETSMANAGER_SCHEDULED_ROTATION_SUCCESS_CHECK',
    AwsConfigRuleName: 'secretsmanager-scheduled-rotation-success-check',
    'NIST-ID': 'AC-2(1)|AC-2(j)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_SECRET_PERIODIC_ROTATION',
    AwsConfigRuleName: 'secretsmanager-secret-periodic-rotation',
    'NIST-ID': 'AC-2(1)|AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_SECRET_PERIODIC_ROTATION',
    AwsConfigRuleName: 'secretsmanager-secret-periodic-rotation',
    'NIST-ID': 'AC-2(1)|AC-3',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_SECRET_UNUSED',
    AwsConfigRuleName: 'secretsmanager-secret-unused',
    'NIST-ID': 'AC-2(1)|AC-3(15)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_SECRET_UNUSED',
    AwsConfigRuleName: 'secretsmanager-secret-unused',
    'NIST-ID': 'AC-2(1)|AC-3',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_USING_CMK',
    AwsConfigRuleName: 'secretsmanager-using-cmk',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECRETSMANAGER_USING_CMK',
    AwsConfigRuleName: 'secretsmanager-using-cmk',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECURITY_ACCOUNT_INFORMATION_PROVIDED',
    AwsConfigRuleName: 'security-account-information-provided',
    'NIST-ID': 'CM-2|CM-2(2)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECURITY_ACCOUNT_INFORMATION_PROVIDED',
    AwsConfigRuleName: 'security-account-information-provided',
    'NIST-ID': 'CM-2|CM-2(2)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECURITYHUB_ENABLED',
    AwsConfigRuleName: 'securityhub-enabled',
    'NIST-ID': 'AU-6(1)|AU-6(5)|CA-7',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECURITYHUB_ENABLED',
    AwsConfigRuleName: 'securityhub-enabled',
    'NIST-ID':
      'AC-2(1)|AC-2(4)|AC-2(12)(a)|AC-2(g)|AC-17(1)|AU-6(1)|AU-6(3)|CA-7(a)|CA-7(b)|SA-10|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(16)|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SERVICE_CATALOG_SHARED_WITHIN_ORGANIZATION',
    AwsConfigRuleName: 'service-catalog-shared-within-organization',
    'NIST-ID': 'AC-3|AC-4|AC-6|CM-8|SC-7',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SERVICE_CATALOG_SHARED_WITHIN_ORGANIZATION',
    AwsConfigRuleName: 'service-catalog-shared-within-organization',
    'NIST-ID': 'AC-3|AC-4|AC-6|CM-8|SC-7',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SES_SENDING_TLS_REQUIRED',
    AwsConfigRuleName: 'ses-sending-tls-required',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SES_SENDING_TLS_REQUIRED',
    AwsConfigRuleName: 'ses-sending-tls-required',
    'NIST-ID': 'SC-7(4)|SC-8|SC-8(1)|SC-8(2)|SC-13|SC-23|SC-23(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SNS_ENCRYPTED_KMS',
    AwsConfigRuleName: 'sns-encrypted-kms',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-7(10)|SC-13|SC-28|SC-28(1)|SI-7(6)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SNS_ENCRYPTED_KMS',
    AwsConfigRuleName: 'sns-encrypted-kms',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SNS_TOPIC_MESSAGE_DELIVERY_NOTIFICATION_ENABLED',
    AwsConfigRuleName: 'sns-topic-message-delivery-notification-enabled',
    'NIST-ID': 'AU-2|AU-12',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SNS_TOPIC_MESSAGE_DELIVERY_NOTIFICATION_ENABLED',
    AwsConfigRuleName: 'sns-topic-message-delivery-notification-enabled',
    'NIST-ID': 'AU-2|AU-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SNS_TOPIC_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'sns-topic-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SNS_TOPIC_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'sns-topic-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SQS_QUEUE_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'sqs-queue-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SQS_QUEUE_NO_PUBLIC_ACCESS',
    AwsConfigRuleName: 'sqs-queue-no-public-access',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SSM_AUTOMATION_BLOCK_PUBLIC_SHARING',
    AwsConfigRuleName: 'ssm-automation-block-public-sharing',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SSM_AUTOMATION_BLOCK_PUBLIC_SHARING',
    AwsConfigRuleName: 'ssm-automation-block-public-sharing',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SSM_AUTOMATION_LOGGING_ENABLED',
    AwsConfigRuleName: 'ssm-automation-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SSM_AUTOMATION_LOGGING_ENABLED',
    AwsConfigRuleName: 'ssm-automation-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SSM_DOCUMENT_NOT_PUBLIC',
    AwsConfigRuleName: 'ssm-document-not-public',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SSM_DOCUMENT_NOT_PUBLIC',
    AwsConfigRuleName: 'ssm-document-not-public',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'STEP_FUNCTIONS_STATE_MACHINE_LOGGING_ENABLED',
    AwsConfigRuleName: 'step-functions-state-machine-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'STEP_FUNCTIONS_STATE_MACHINE_LOGGING_ENABLED',
    AwsConfigRuleName: 'step-functions-state-machine-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SUBNET_AUTO_ASSIGN_PUBLIC_IP_DISABLED',
    AwsConfigRuleName: 'subnet-auto-assign-public-ip-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'SUBNET_AUTO_ASSIGN_PUBLIC_IP_DISABLED',
    AwsConfigRuleName: 'subnet-auto-assign-public-ip-disabled',
    'NIST-ID':
      'AC-3|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(9)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'TRANSFER_CONNECTOR_AS2_ENCRYPTION_ALGORITHM_CHECK',
    AwsConfigRuleName: 'transfer-connector-as2-encryption-algorithm-check',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier:
      'TRANSFER_CONNECTOR_AS2_ENCRYPTION_ALGORITHM_CHECK',
    AwsConfigRuleName: 'transfer-connector-as2-encryption-algorithm-check',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'TRANSFER_CONNECTOR_LOGGING_ENABLED',
    AwsConfigRuleName: 'transfer-connector-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4(26)|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9(7)|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'TRANSFER_CONNECTOR_LOGGING_ENABLED',
    AwsConfigRuleName: 'transfer-connector-logging-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(12)|AC-4|AC-6(9)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-9|AU-10|AU-12|CA-7|SC-7(9)|SI-3(8)|SI-4|SI-4(20)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'TRANSFER_FAMILY_SERVER_NO_FTP',
    AwsConfigRuleName: 'transfer-family-server-no-ftp',
    'NIST-ID': 'CM-7|IA-5|SC-8',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'TRANSFER_FAMILY_SERVER_NO_FTP',
    AwsConfigRuleName: 'transfer-family-server-no-ftp',
    'NIST-ID': 'CM-7|IA-5|SC-8',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_DEFAULT_SECURITY_GROUP_CLOSED',
    AwsConfigRuleName: 'vpc-default-security-group-closed',
    'NIST-ID': 'SC-7|SC-7(4)|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_DEFAULT_SECURITY_GROUP_CLOSED',
    AwsConfigRuleName: 'vpc-default-security-group-closed',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_ENDPOINT_ENABLED',
    AwsConfigRuleName: 'vpc-endpoint-enabled',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_ENDPOINT_ENABLED',
    AwsConfigRuleName: 'vpc-endpoint-enabled',
    'NIST-ID':
      'AC-3|AC-3(7)|AC-4|AC-4(21)|AC-6|AC-21|SC-7|SC-7(3)|SC-7(4)|SC-7(11)|SC-7(16)|SC-7(20)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
    AwsConfigRuleName: 'vpc-flow-logs-enabled',
    'NIST-ID': 'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-12|CA-7|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
    AwsConfigRuleName: 'vpc-flow-logs-enabled',
    'NIST-ID': 'AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_NETWORK_ACL_UNUSED_CHECK',
    AwsConfigRuleName: 'vpc-network-acl-unused-check',
    'NIST-ID': 'CM-8(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_NETWORK_ACL_UNUSED_CHECK',
    AwsConfigRuleName: 'vpc-network-acl-unused-check',
    'NIST-ID': 'CM-8(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_SG_OPEN_ONLY_TO_AUTHORIZED_PORTS',
    AwsConfigRuleName: 'vpc-sg-open-only-to-authorized-ports',
    'NIST-ID': 'SC-7|SC-7(4)|SC-7(5)|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_SG_OPEN_ONLY_TO_AUTHORIZED_PORTS',
    AwsConfigRuleName: 'vpc-sg-open-only-to-authorized-ports',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_VPN_2_TUNNELS_UP',
    AwsConfigRuleName: 'vpc-vpn-2-tunnels-up',
    'NIST-ID': 'CP-6(2)|CP-10|SC-5(2)|SC-36|SI-13(5)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_VPN_2_TUNNELS_UP',
    AwsConfigRuleName: 'vpc-vpn-2-tunnels-up',
    'NIST-ID': 'CP-10',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_CLASSIC_LOGGING_ENABLED',
    AwsConfigRuleName: 'waf-classic-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_CLASSIC_LOGGING_ENABLED',
    AwsConfigRuleName: 'waf-classic-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_GLOBAL_RULE_NOT_EMPTY',
    AwsConfigRuleName: 'waf-global-rule-not-empty',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_GLOBAL_RULE_NOT_EMPTY',
    AwsConfigRuleName: 'waf-global-rule-not-empty',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_GLOBAL_RULEGROUP_NOT_EMPTY',
    AwsConfigRuleName: 'waf-global-rulegroup-not-empty',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_GLOBAL_RULEGROUP_NOT_EMPTY',
    AwsConfigRuleName: 'waf-global-rulegroup-not-empty',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_REGIONAL_RULE_NOT_EMPTY',
    AwsConfigRuleName: 'waf-regional-rule-not-empty',
    'NIST-ID': 'AC-4(21)|SC-7|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_REGIONAL_RULE_NOT_EMPTY',
    AwsConfigRuleName: 'waf-regional-rule-not-empty',
    'NIST-ID': 'AC-4(21)|SC-7|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_REGIONAL_RULEGROUP_NOT_EMPTY',
    AwsConfigRuleName: 'waf-regional-rulegroup-not-empty',
    'NIST-ID': 'AC-4(21)|SC-7|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAF_REGIONAL_RULEGROUP_NOT_EMPTY',
    AwsConfigRuleName: 'waf-regional-rulegroup-not-empty',
    'NIST-ID': 'AC-4(21)|SC-7|SC-7(11)|SC-7(16)|SC-7(21)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_LOGGING_ENABLED',
    AwsConfigRuleName: 'wafv2-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_LOGGING_ENABLED',
    AwsConfigRuleName: 'wafv2-logging-enabled',
    'NIST-ID':
      'AU-2(a)|AU-2(d)|AU-3|AU-12(a)|AU-12(c)|SC-7|SI-4(a)|SI-4(b)|SI-4(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_RULEGROUP_LOGGING_ENABLED',
    AwsConfigRuleName: 'wafv2-rulegroup-logging-enabled',
    'NIST-ID':
      'AC-4(26)|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-7(8)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_RULEGROUP_LOGGING_ENABLED',
    AwsConfigRuleName: 'wafv2-rulegroup-logging-enabled',
    'NIST-ID':
      'AC-4|AU-2|AU-3|AU-6(3)|AU-6(4)|AU-10|AU-12|CA-7|SC-7(9)|SC-7(10)|SI-7(8)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_WEBACL_NOT_EMPTY',
    AwsConfigRuleName: 'wafv2-webacl-not-empty',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_WEBACL_NOT_EMPTY',
    AwsConfigRuleName: 'wafv2-webacl-not-empty',
    'NIST-ID': 'CA-9(1)|CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WORKSPACES_ROOT_VOLUME_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'workspaces-root-volume-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WORKSPACES_ROOT_VOLUME_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'workspaces-root-volume-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WORKSPACES_USER_VOLUME_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'workspaces-user-volume-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 5
  },
  {
    AwsConfigRuleSourceIdentifier: 'WORKSPACES_USER_VOLUME_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'workspaces-user-volume-encryption-enabled',
    'NIST-ID': 'CA-9(1)|CM-3(6)|SC-13|SC-28|SC-28(1)',
    Rev: 4
  }
];
