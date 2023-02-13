export const data = [
  {
    AwsConfigRuleSourceIdentifier:
      'SECRETSMANAGER_SCHEDULED_ROTATION_SUCCESS_CHECK',
    AwsConfigRuleName: 'secretsmanager-scheduled-rotation-success-check',
    'NIST-ID': 'AC-2(1)|AC-2(j)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_GROUP_MEMBERSHIP_CHECK',
    AwsConfigRuleName: 'iam-user-group-membership-check',
    'NIST-ID': 'AC-2(1)|AC-2(j)|AC-3|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_PASSWORD_POLICY',
    AwsConfigRuleName: 'iam-password-policy',
    'NIST-ID': 'AC-2(1)|AC-2(f)|AC-2(j)|IA-2|IA-5(1)(a)(d)(e)|IA-5(4)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACCESS_KEYS_ROTATED',
    AwsConfigRuleName: 'access-keys-rotated',
    'NIST-ID': 'AC-2(1)|AC-2(j)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_UNUSED_CREDENTIALS_CHECK',
    AwsConfigRuleName: 'iam-user-unused-credentials-check',
    'NIST-ID': 'AC-2(1)|AC-2(3)|AC-2(f)|AC-3|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SECURITYHUB_ENABLED',
    AwsConfigRuleName: 'securityhub-enabled',
    'NIST-ID':
      'AC-2(1)|AC-2(4)|AC-2(12)(a)|AC-2(g)|AC-17(1)|AU-6(1)(3)|CA-7(a)(b)|SA-10|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(16)|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_ENABLED_CENTRALIZED',
    AwsConfigRuleName: 'guardduty-enabled-centralized',
    'NIST-ID':
      'AC-2(1)|AC-2(4)|AC-2(12)(a)|AC-2(g)|AC-17(1)|AU-6(1)(3)|CA-7(a)(b)|RA-5|SA-10|SI-4(1)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(16)|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_CLOUD_WATCH_LOGS_ENABLED',
    AwsConfigRuleName: 'cloud-trail-cloud-watch-logs-enabled',
    'NIST-ID':
      'AC-2(4)|AC-2(g)|AU-2(a)(d)|AU-3|AU-6(1)(3)|AU-7(1)|AU-12(a)(c)|CA-7(a)(b)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_ENABLED',
    AwsConfigRuleName: 'cloudtrail-enabled',
    'NIST-ID': 'AC-2(4)|AC-2(g)|AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MULTI_REGION_CLOUD_TRAIL_ENABLED',
    AwsConfigRuleName: 'multi-region-cloudtrail-enabled',
    'NIST-ID': 'AC-2(4)|AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_LOGGING_ENABLED',
    AwsConfigRuleName: 'rds-logging-enabled',
    'NIST-ID': 'AC-2(4)|AC-2(g)|AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_ALARM_ACTION_CHECK',
    AwsConfigRuleName: 'cloudwatch-alarm-action-check',
    'NIST-ID':
      'AC-2(4)|AU-6(1)(3)|AU-7(1)|CA-7(a)(b)|IR-4(1)|SI-4(2)|SI-4(4)|SI-4(5)|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_CONFIGURATION_CHECK',
    AwsConfigRuleName: 'redshift-cluster-configuration-check',
    'NIST-ID': 'AC-2(4)|AC-2(g)|AU-2(a)(d)|AU-3|AU-12(a)(c)|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_ROOT_ACCESS_KEY_CHECK',
    AwsConfigRuleName: 'iam-root-access-key-check',
    'NIST-ID': 'AC-2(f)|AC-2(j)|AC-3|AC-6|AC-6(10)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_LOGGING_ENABLED',
    AwsConfigRuleName: 's3-bucket-logging-enabled',
    'NIST-ID': 'AC-2(g)|AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_S3_DATAEVENTS_ENABLED',
    AwsConfigRuleName: 'cloudtrail-s3-dataevents-enabled',
    'NIST-ID': 'AC-2(g)|AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROOT_ACCOUNT_MFA_ENABLED',
    AwsConfigRuleName: 'root-account-mfa-enabled',
    'NIST-ID': 'AC-2(j)|IA-2(1)(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_KERBEROS_ENABLED',
    AwsConfigRuleName: 'emr-kerberos-enabled',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_GROUP_HAS_USERS_CHECK',
    AwsConfigRuleName: 'iam-group-has-users-check',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6|SC-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS',
    AwsConfigRuleName: 'iam-policy-no-statements-with-admin-access',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6|SC-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_NO_POLICIES_CHECK',
    AwsConfigRuleName: 'iam-user-no-policies-check',
    'NIST-ID': 'AC-2(j)|AC-3|AC-5(c)|AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
    AwsConfigRuleName: 's3-bucket-public-write-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_FUNCTION_PUBLIC_ACCESS_PROHIBITED',
    AwsConfigRuleName: 'lambda-function-public-access-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SNAPSHOTS_PUBLIC_PROHIBITED',
    AwsConfigRuleName: 'rds-snapshots-public-prohibited',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_CLUSTER_PUBLIC_ACCESS_CHECK',
    AwsConfigRuleName: 'redshift-cluster-public-access-check',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
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
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_ACCOUNT_LEVEL_PUBLIC_ACCESS_BLOCKS',
    AwsConfigRuleName: 's3-account-level-public-access-blocks',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DMS_REPLICATION_NOT_PUBLIC',
    AwsConfigRuleName: 'dms-replication-not-public',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_SNAPSHOT_PUBLIC_RESTORABLE_CHECK',
    AwsConfigRuleName: 'ebs-snapshot-public-restorable-check',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_NO_DIRECT_INTERNET_ACCESS',
    AwsConfigRuleName: 'sagemaker-notebook-no-direct-internet-access',
    'NIST-ID': 'AC-3|AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_PUBLIC_ACCESS_CHECK',
    AwsConfigRuleName: 'rds-instance-public-access-check',
    'NIST-ID': 'AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'LAMBDA_INSIDE_VPC',
    AwsConfigRuleName: 'lambda-inside-vpc',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'INSTANCES_IN_VPC',
    AwsConfigRuleName: 'ec2-instances-in-vpc',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
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
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_DEFAULT_SECURITY_GROUP_CLOSED',
    AwsConfigRuleName: 'vpc-default-security-group-closed',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_SG_OPEN_ONLY_TO_AUTHORIZED_PORTS',
    AwsConfigRuleName: 'vpc-sg-open-only-to-authorized-ports',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ACM_CERTIFICATE_EXPIRATION_CHECK',
    AwsConfigRuleName: 'acm-certificate-expiration-check',
    'NIST-ID': 'AC-4|AC-17(2)|SC-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_NO_PUBLIC_IP',
    AwsConfigRuleName: 'ec2-instance-no-public-ip',
    'NIST-ID': 'AC-4|AC-6|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_IN_VPC_ONLY',
    AwsConfigRuleName: 'elasticsearch-in-vpc-only',
    'NIST-ID': 'AC-4|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EMR_MASTER_NO_PUBLIC_IP',
    AwsConfigRuleName: 'emr-master-no-public-ip',
    'NIST-ID': 'AC-4|AC-21(b)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'INTERNET_GATEWAY_AUTHORIZED_VPC_ONLY',
    AwsConfigRuleName: 'internet-gateway-authorized-vpc-only',
    'NIST-ID': 'AC-4|AC-17(3)|SC-7|SC-7(3)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_ENVVAR_AWSCRED_CHECK',
    AwsConfigRuleName: 'codebuild-project-envvar-awscred-check',
    'NIST-ID': 'AC-6|IA-5(7)|SA-3(a)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_IMDSV2_CHECK',
    AwsConfigRuleName: 'ec2-imdsv2-check',
    'NIST-ID': 'AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_NO_INLINE_POLICY_CHECK',
    AwsConfigRuleName: 'iam-no-inline-policy-check',
    'NIST-ID': 'AC-6',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_HTTP_TO_HTTPS_REDIRECTION_CHECK',
    AwsConfigRuleName: 'alb-http-to-https-redirection-check',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'REDSHIFT_REQUIRE_TLS_SSL',
    AwsConfigRuleName: 'redshift-require-tls-ssl',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
    AwsConfigRuleName: 's3-bucket-ssl-requests-only',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_ACM_CERTIFICATE_REQUIRED',
    AwsConfigRuleName: 'elb-acm-certificate-required',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_HTTP_DROP_INVALID_HEADER_ENABLED',
    AwsConfigRuleName: 'alb-http-drop-invalid-header-enabled',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_TLS_HTTPS_LISTENERS_ONLY',
    AwsConfigRuleName: 'elb-tls-https-listeners-only',
    'NIST-ID': 'AC-17(2)|SC-7|SC-8|SC-8(1)|SC-23',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_EXECUTION_LOGGING_ENABLED',
    AwsConfigRuleName: 'api-gw-execution-logging-enabled',
    'NIST-ID': 'AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_LOGGING_ENABLED',
    AwsConfigRuleName: 'elb-logging-enabled',
    'NIST-ID': 'AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_FLOW_LOGS_ENABLED',
    AwsConfigRuleName: 'vpc-flow-logs-enabled',
    'NIST-ID': 'AU-2(a)(d)|AU-3|AU-12(a)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'WAFV2_LOGGING_ENABLED',
    AwsConfigRuleName: 'wafv2-logging-enabled',
    'NIST-ID': 'AU-2(a)(d)|AU-3|AU-12(a)(c)|SC-7|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 'cloud-trail-encryption-enabled',
    'NIST-ID': 'AU-9|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
    AwsConfigRuleName: 'cloudwatch-log-group-encrypted',
    'NIST-ID': 'AU-9|SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_REPLICATION_ENABLED',
    AwsConfigRuleName: 's3-bucket-replication-enabled',
    'NIST-ID': 'AU-9(2)|CP-9(b)|CP-10|SC-5|SC-36',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CW_LOGGROUP_RETENTION_PERIOD_CHECK',
    AwsConfigRuleName: 'cw-loggroup-retention-period-check',
    'NIST-ID': 'AU-11|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_DETAILED_MONITORING_ENABLED',
    AwsConfigRuleName: 'ec2-instance-detailed-monitoring-enabled',
    'NIST-ID': 'CA-7(a)(b)|SI-4(2)|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_ENHANCED_MONITORING_ENABLED',
    AwsConfigRuleName: 'rds-enhanced-monitoring-enabled',
    'NIST-ID': 'CA-7(a)(b)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_INSTANCE_MANAGED_BY_SSM',
    AwsConfigRuleName: 'ec2-instance-managed-by-systems-manager',
    'NIST-ID': 'CM-2|CM-7(a)|CM-8(1)|CM-8(3)(a)|SA-3(a)|SA-10|SI-2(2)|SI-7(1)',
    Rev: 4
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
    AwsConfigRuleSourceIdentifier: 'EC2_STOPPED_INSTANCE',
    AwsConfigRuleName: 'ec2-stopped-instance',
    'NIST-ID': 'CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_VOLUME_INUSE_CHECK',
    AwsConfigRuleName: 'ec2-volume-inuse-check',
    'NIST-ID': 'CM-2|SC-4',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'elb-deletion-protection-enabled',
    'NIST-ID': 'CM-2|CP-10',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUDTRAIL_SECURITY_TRAIL_ENABLED',
    AwsConfigRuleName: 'cloudtrail-security-trail-enabled',
    'NIST-ID': 'CM-2',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'EC2_MANAGEDINSTANCE_PATCH_COMPLIANCE_STATUS_CHECK',
    AwsConfigRuleName: 'ec2-managedinstance-patch-compliance-status-check',
    'NIST-ID': 'CM-8(3)(a)|SI-2(2)|SI-7(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DB_INSTANCE_BACKUP_ENABLED',
    AwsConfigRuleName: 'db-instance-backup-enabled',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_PITR_ENABLED',
    AwsConfigRuleName: 'dynamodb-pitr-enabled',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICACHE_REDIS_CLUSTER_AUTOMATIC_BACKUP_CHECK',
    AwsConfigRuleName: 'elasticache-redis-cluster-automatic-backup-check',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'dynamodb-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EBS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'ebs-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'efs-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_IN_BACKUP_PLAN',
    AwsConfigRuleName: 'rds-in-backup-plan',
    'NIST-ID': 'CP-9(b)|CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_AUTOSCALING_ENABLED',
    AwsConfigRuleName: 'dynamodb-autoscaling-enabled',
    'NIST-ID': 'CP-10|SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_MULTI_AZ_SUPPORT',
    AwsConfigRuleName: 'rds-multi-az-support',
    'NIST-ID': 'CP-10|SC-5|SC-36',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_VERSIONING_ENABLED',
    AwsConfigRuleName: 's3-bucket-versioning-enabled',
    'NIST-ID': 'CP-10|SI-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'VPC_VPN_2_TUNNELS_UP',
    AwsConfigRuleName: 'vpc-vpn-2-tunnels-up',
    'NIST-ID': 'CP-10',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELB_CROSS_ZONE_LOAD_BALANCING_ENABLED',
    AwsConfigRuleName: 'elb-cross-zone-load-balancing-enabled',
    'NIST-ID': 'CP-10|SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ROOT_ACCOUNT_HARDWARE_MFA_ENABLED',
    AwsConfigRuleName: 'root-account-hardware-mfa-enabled',
    'NIST-ID': 'IA-2(1)(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
    AwsConfigRuleName: 'mfa-enabled-for-iam-console-access',
    'NIST-ID': 'IA-2(1)(2)(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'IAM_USER_MFA_ENABLED',
    AwsConfigRuleName: 'iam-user-mfa-enabled',
    'NIST-ID': 'IA-2(1)(2)(11)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'GUARDDUTY_NON_ARCHIVED_FINDINGS',
    AwsConfigRuleName: 'guardduty-non-archived-findings',
    'NIST-ID': 'IR-4(1)|IR-6(1)|IR-7(1)|RA-5|SA-10|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CODEBUILD_PROJECT_SOURCE_REPO_URL_CHECK',
    AwsConfigRuleName: 'codebuild-project-source-repo-url-check',
    'NIST-ID': 'SA-3(a)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'AUTOSCALING_GROUP_ELB_HEALTHCHECK_REQUIRED',
    AwsConfigRuleName: 'autoscaling-group-elb-healthcheck-required',
    'NIST-ID': 'SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_INSTANCE_DELETION_PROTECTION_ENABLED',
    AwsConfigRuleName: 'rds-instance-deletion-protection-enabled',
    'NIST-ID': 'SC-5',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ALB_WAF_ENABLED',
    AwsConfigRuleName: 'alb-waf-enabled',
    'NIST-ID': 'SC-7|SI-4(a)(b)(c)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'ELASTICSEARCH_NODE_TO_NODE_ENCRYPTION_CHECK',
    AwsConfigRuleName: 'elasticsearch-node-to-node-encryption-check',
    'NIST-ID': 'SC-7|SC-8|SC-8(1)',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CMK_BACKING_KEY_ROTATION_ENABLED',
    AwsConfigRuleName: 'cmk-backing-key-rotation-enabled',
    'NIST-ID': 'SC-12',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'KMS_CMK_NOT_SCHEDULED_FOR_DELETION',
    AwsConfigRuleName: 'kms-cmk-not-scheduled-for-deletion',
    'NIST-ID': 'SC-12|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'API_GW_CACHE_ENABLED_AND_ENCRYPTED',
    AwsConfigRuleName: 'api-gw-cache-enabled-and-encrypted',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EFS_ENCRYPTED_CHECK',
    AwsConfigRuleName: 'efs-encrypted-check',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ELASTICSEARCH_ENCRYPTED_AT_REST',
    AwsConfigRuleName: 'elasticsearch-encrypted-at-rest',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'ENCRYPTED_VOLUMES',
    AwsConfigRuleName: 'encrypted-volumes',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
    AwsConfigRuleName: 'rds-storage-encrypted',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
    AwsConfigRuleName: 's3-bucket-server-side-encryption-enabled',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_ENDPOINT_CONFIGURATION_KMS_KEY_CONFIGURED',
    AwsConfigRuleName: 'sagemaker-endpoint-configuration-kms-key-configured',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier:
      'SAGEMAKER_NOTEBOOK_INSTANCE_KMS_KEY_CONFIGURED',
    AwsConfigRuleName: 'sagemaker-notebook-instance-kms-key-configured',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'SNS_ENCRYPTED_KMS',
    AwsConfigRuleName: 'sns-encrypted-kms',
    'NIST-ID': 'SC-13|SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTED_KMS',
    AwsConfigRuleName: 'dynamodb-table-encrypted-kms',
    'NIST-ID': 'SC-13',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'S3_BUCKET_DEFAULT_LOCK_ENABLED',
    AwsConfigRuleName: 's3-bucket-default-lock-enabled',
    'NIST-ID': 'SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'EC2_EBS_ENCRYPTION_BY_DEFAULT',
    AwsConfigRuleName: 'ec2-ebs-encryption-by-default',
    'NIST-ID': 'SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'RDS_SNAPSHOT_ENCRYPTED',
    AwsConfigRuleName: 'rds-snapshot-encrypted',
    'NIST-ID': 'SC-28',
    Rev: 4
  },
  {
    AwsConfigRuleSourceIdentifier: 'CLOUD_TRAIL_LOG_FILE_VALIDATION_ENABLED',
    AwsConfigRuleName: 'cloud-trail-log-file-validation-enabled',
    'NIST-ID': 'SI-7|SI-7(1)',
    Rev: 4
  }
];
