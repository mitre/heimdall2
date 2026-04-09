// CCI + NIST Mappings for Bridgecrew Checkov rules
// Updated: 2026-04-04
//
// Mapping Methodology:
//   Use `checkov --list` to get starting baseline document.
//   Using generative AI (Opus 4.6), mapped from Checkov v3.2.506 to CIS v8 rule IDs to NIST control families to DISA CCI.  Results were peer reviewed by two personnel after for completeness.
//   Total checks mapped: 1341

export const data: Record<string, {cci: string[]; nist: string[]}> = {
  // CKV2_ADO_1: Ensure at least two approving reviews for PRs
  'CKV2_ADO_1': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV2_ANSIBLE_1: Ensure that HTTPS url is used with uri
  'CKV2_ANSIBLE_1': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_ANSIBLE_2: Ensure that HTTPS url is used with get_url
  'CKV2_ANSIBLE_2': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_ANSIBLE_3: Ensure block is handling task errors properly
  'CKV2_ANSIBLE_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_ANSIBLE_4: Ensure that packages with untrusted or missing GPG signatures are not used by...
  'CKV2_ANSIBLE_4': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV2_ANSIBLE_5: Ensure that SSL validation isn't disabled with dnf
  'CKV2_ANSIBLE_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_ANSIBLE_6: Ensure that certificate validation isn't disabled with dnf
  'CKV2_ANSIBLE_6': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_AWS_1: Ensure that all NACL are attached to subnets
  'CKV2_AWS_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_10: Ensure CloudTrail trails are integrated with CloudWatch Logs
  'CKV2_AWS_10': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV2_AWS_11: Ensure VPC flow logging is enabled in all VPCs
  'CKV2_AWS_11': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AWS_12: Ensure the default security group of every VPC restricts all traffic
  'CKV2_AWS_12': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV2_AWS_14: Ensure that IAM groups includes at least one IAM user
  'CKV2_AWS_14': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV2_AWS_15: Ensure that auto Scaling groups that are associated with a load balancer are ...
  'CKV2_AWS_15': {cci: ['CCI-000557', 'CCI-002386'], nist: ['CP-10(4)', 'SC-5(2)']},
  // CKV2_AWS_16: Ensure that Auto Scaling is enabled on your DynamoDB tables
  'CKV2_AWS_16': {cci: ['CCI-000557', 'CCI-002386'], nist: ['CP-10(4)', 'SC-5(2)']},
  // CKV2_AWS_18: Ensure that Elastic File System (Amazon EFS) file systems are added in the ba...
  'CKV2_AWS_18': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_19: Ensure that all EIP addresses allocated to a VPC are attached to EC2 instances
  'CKV2_AWS_19': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AWS_2: Ensure that only encrypted EBS volumes are attached to EC2 instances
  'CKV2_AWS_2': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV2_AWS_20: Ensure that ALB redirects HTTP requests into HTTPS ones
  'CKV2_AWS_20': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV2_AWS_21: Ensure that all IAM users are members of at least one IAM group.
  'CKV2_AWS_21': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV2_AWS_22: Ensure an IAM User does not have access to the console
  'CKV2_AWS_22': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_23: Route53 A Record has Attached Resource
  'CKV2_AWS_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_27: Ensure Postgres RDS as aws_rds_cluster has Query Logging enabled
  'CKV2_AWS_27': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AWS_28: Ensure public facing ALB are protected by WAF
  'CKV2_AWS_28': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV2_AWS_29: Ensure public API gateway are protected by WAF
  'CKV2_AWS_29': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV2_AWS_3: Ensure GuardDuty is enabled to specific org/region
  'CKV2_AWS_3': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV2_AWS_30: Ensure Postgres RDS as aws_db_instance has Query Logging enabled
  'CKV2_AWS_30': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AWS_31: Ensure WAF2 has a Logging Configuration
  'CKV2_AWS_31': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AWS_32: Ensure CloudFront distribution has a response headers policy attached
  'CKV2_AWS_32': {cci: ['CCI-000227', 'CCI-001310'], nist: ['IR-4(1)', 'IR-5(1)']},
  // CKV2_AWS_33: Ensure AppSync is protected by WAF
  'CKV2_AWS_33': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV2_AWS_34: AWS SSM Parameter should be Encrypted
  'CKV2_AWS_34': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV2_AWS_35: AWS NAT Gateways should be utilized for the default route
  'CKV2_AWS_35': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_36: Ensure terraform is not sending SSM secrets to untrusted domains over HTTP
  'CKV2_AWS_36': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_37: Ensure CodeCommit associates an approval rule
  'CKV2_AWS_37': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV2_AWS_38: Ensure Domain Name System Security Extensions (DNSSEC) signing is enabled for...
  'CKV2_AWS_38': {cci: ['CCI-001099'], nist: ['SC-7(4)', 'SC-20']},
  // CKV2_AWS_39: Ensure Domain Name System (DNS) query logging is enabled for Amazon Route 53 ...
  'CKV2_AWS_39': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AWS_4: Ensure API Gateway stage have logging level defined as appropriate
  'CKV2_AWS_4': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AWS_40: Ensure AWS IAM policy does not allow full IAM privileges
  'CKV2_AWS_40': {cci: ['CCI-000235', 'CCI-000226'], nist: ['AC-6(10)', 'AC-6(1)']},
  // CKV2_AWS_41: Ensure an IAM role is attached to EC2 instance
  'CKV2_AWS_41': {cci: ['CCI-000016', 'CCI-000213'], nist: ['AC-2(1)', 'AC-3']},
  // CKV2_AWS_42: Ensure AWS CloudFront distribution uses custom SSL certificate
  'CKV2_AWS_42': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_43: Ensure S3 Bucket does not allow access to all Authenticated users
  'CKV2_AWS_43': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_44: Ensure AWS route table with VPC peering does not contain routes overly permis...
  'CKV2_AWS_44': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AWS_45: Ensure AWS Config recorder is enabled to record all supported resources
  'CKV2_AWS_45': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_46: Ensure AWS CloudFront Distribution with S3 have Origin Access set to enabled
  'CKV2_AWS_46': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_47: Ensure AWS CloudFront attached WAFv2 WebACL is configured with AMR for Log4j ...
  'CKV2_AWS_47': {cci: ['CCI-001109', 'CCI-001248'], nist: ['SC-7(14)', 'SI-3(7)']},
  // CKV2_AWS_48: Ensure AWS Config must record all possible resources
  'CKV2_AWS_48': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_49: Ensure AWS Database Migration Service endpoints have SSL configured
  'CKV2_AWS_49': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_AWS_5: Ensure that Security Groups are attached to another resource
  'CKV2_AWS_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_50: Ensure AWS ElastiCache Redis cluster with Multi-AZ Automatic Failover feature...
  'CKV2_AWS_50': {cci: ['CCI-000555', 'CCI-000509'], nist: ['CP-10(2)', 'CP-9']},
  // CKV2_AWS_51: Ensure AWS API Gateway endpoints uses client certificate authentication
  'CKV2_AWS_51': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_52: Ensure AWS ElasticSearch/OpenSearch Fine-grained access control is enabled
  'CKV2_AWS_52': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_53: Ensure AWS API gateway request is validated
  'CKV2_AWS_53': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_54: Ensure AWS CloudFront distribution is using secure SSL protocols for HTTPS co...
  'CKV2_AWS_54': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_AWS_55: Ensure AWS EMR cluster is configured with security configuration
  'CKV2_AWS_55': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_56: Ensure AWS Managed IAMFullAccess IAM policy is not used.
  'CKV2_AWS_56': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_57: Ensure Secrets Manager secrets should have automatic rotation enabled
  'CKV2_AWS_57': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV2_AWS_58: Ensure AWS Neptune cluster deletion protection is enabled
  'CKV2_AWS_58': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_59: Ensure ElasticSearch/OpenSearch has dedicated master node enabled
  'CKV2_AWS_59': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_6: Ensure that S3 bucket has a Public Access block
  'CKV2_AWS_6': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV2_AWS_60: Ensure RDS instance with copy tags to snapshots is enabled
  'CKV2_AWS_60': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_61: Ensure that an S3 bucket has a lifecycle configuration
  'CKV2_AWS_61': {cci: ['CCI-001904', 'CCI-000167'], nist: ['MP-6(1)', 'AU-11']},
  // CKV2_AWS_62: Ensure S3 buckets should have event notifications enabled
  'CKV2_AWS_62': {cci: ['CCI-002687', 'CCI-000229'], nist: ['SI-4(5)', 'IR-6(1)']},
  // CKV2_AWS_63: Ensure Network firewall has logging configuration defined
  'CKV2_AWS_63': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AWS_64: Ensure KMS key Policy is defined
  'CKV2_AWS_64': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AWS_65: Ensure access control lists for S3 buckets are disabled
  'CKV2_AWS_65': {cci: ['CCI-002166'], nist: ['AC-3(4)']},
  // CKV2_AWS_66: Ensure MWAA environment is not publicly accessible
  'CKV2_AWS_66': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV2_AWS_68: Ensure SageMaker notebook instance IAM policy is not overly permissive
  'CKV2_AWS_68': {cci: ['CCI-000235', 'CCI-000226'], nist: ['AC-6(10)', 'AC-6(1)']},
  // CKV2_AWS_69: Ensure AWS RDS database instance configured with encryption in transit
  'CKV2_AWS_69': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_AWS_7: Ensure that Amazon EMR clusters' security groups are not open to the world
  'CKV2_AWS_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_70: Ensure API gateway method has authorization or API key set
  'CKV2_AWS_70': {cci: ['CCI-002170', 'CCI-001953'], nist: ['AC-3(8)', 'IA-2(8)']},
  // CKV2_AWS_71: Ensure AWS ACM Certificate domain name does not include wildcards
  'CKV2_AWS_71': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_72: Ensure AWS CloudFront origin protocol policy enforces HTTPS-only
  'CKV2_AWS_72': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_73: Ensure AWS SQS uses CMK not AWS default keys for encryption
  'CKV2_AWS_73': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AWS_74: Ensure AWS Load Balancers use strong ciphers
  'CKV2_AWS_74': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV2_AWS_75: Ensure no open CORS policy
  'CKV2_AWS_75': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_76: Ensure AWS ALB attached WAFv2 WebACL is configured with AMR for Log4j Vulnera...
  'CKV2_AWS_76': {cci: ['CCI-001109', 'CCI-001248'], nist: ['SC-7(14)', 'SI-3(7)']},
  // CKV2_AWS_77: Ensure AWS API Gateway Rest API attached WAFv2 WebACL is configured with AMR ...
  'CKV2_AWS_77': {cci: ['CCI-001109', 'CCI-001248'], nist: ['SC-7(14)', 'SI-3(7)']},
  // CKV2_AWS_78: Ensure AWS AppSync attached WAFv2 WebACL is configured with AMR for Log4j Vul...
  'CKV2_AWS_78': {cci: ['CCI-001109', 'CCI-001248'], nist: ['SC-7(14)', 'SI-3(7)']},
  // CKV2_AWS_8: Ensure that RDS clusters has backup plan of AWS Backup
  'CKV2_AWS_8': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AWS_9: Ensure that EBS are added in the backup plans of AWS Backup
  'CKV2_AWS_9': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_1: Ensure storage for critical data are encrypted with Customer Managed Key
  'CKV2_AZURE_1': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AZURE_10: Ensure that Microsoft Antimalware is configured to automatically updates for ...
  'CKV2_AZURE_10': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_11: Ensure that Azure Data Explorer encryption at rest uses a customer-managed key
  'CKV2_AZURE_11': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV2_AZURE_12: Ensure that virtual machines are backed up using Azure Backup
  'CKV2_AZURE_12': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_13: Ensure that sql servers enables data security policy
  'CKV2_AZURE_13': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_14: Ensure that Unattached disks are encrypted
  'CKV2_AZURE_14': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV2_AZURE_15: Ensure that Azure data factories are encrypted with a customer-managed key
  'CKV2_AZURE_15': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AZURE_16: Ensure that MySQL server enables customer-managed key for encryption
  'CKV2_AZURE_16': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AZURE_17: Ensure that PostgreSQL server enables customer-managed key for encryption
  'CKV2_AZURE_17': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AZURE_19: Ensure that Azure Synapse workspaces have no IP firewall rules attached
  'CKV2_AZURE_19': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV2_AZURE_2: Ensure that Vulnerability Assessment (VA) is enabled on a SQL server by setti...
  'CKV2_AZURE_2': {cci: ['CCI-001645'], nist: ['RA-5(2)']},
  // CKV2_AZURE_20: Ensure Storage logging is enabled for Table service for read requests
  'CKV2_AZURE_20': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AZURE_21: Ensure Storage logging is enabled for Blob service for read requests
  'CKV2_AZURE_21': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AZURE_22: Ensure that Cognitive Services enables customer-managed key for encryption
  'CKV2_AZURE_22': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AZURE_23: Ensure Azure spring cloud is configured with Virtual network (Vnet)
  'CKV2_AZURE_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_24: Ensure Azure automation account does NOT have overly permissive network access
  'CKV2_AZURE_24': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_25: Ensure Azure SQL database Transparent Data Encryption (TDE) is enabled
  'CKV2_AZURE_25': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV2_AZURE_26: Ensure Azure PostgreSQL Flexible server is not configured with overly permiss...
  'CKV2_AZURE_26': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_27: Ensure Azure AD authentication is enabled for Azure SQL (MSSQL)
  'CKV2_AZURE_27': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_29: Ensure AKS cluster has Azure CNI networking enabled
  'CKV2_AZURE_29': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_3: Ensure that VA setting Periodic Recurring Scans is enabled on a SQL server
  'CKV2_AZURE_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_30: Ensure Azure Container Registry (ACR) has HTTPS enabled for webhook
  'CKV2_AZURE_30': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_AZURE_31: Ensure VNET subnet is configured with a Network Security Group (NSG)
  'CKV2_AZURE_31': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_32: Ensure private endpoint is configured to key vault
  'CKV2_AZURE_32': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_33: Ensure storage account is configured with private endpoint
  'CKV2_AZURE_33': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_34: Ensure Azure SQL server firewall is not overly permissive
  'CKV2_AZURE_34': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_37: Ensure Azure MariaDB server is using latest TLS (1.2)
  'CKV2_AZURE_37': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV2_AZURE_38: Ensure soft-delete is enabled on Azure storage account
  'CKV2_AZURE_38': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_39: Ensure Azure VM is not configured with public IP and serial console access
  'CKV2_AZURE_39': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV2_AZURE_4: Ensure Azure SQL server ADS VA Send scan reports to is configured
  'CKV2_AZURE_4': {cci: ['CCI-001644', 'CCI-002606'], nist: ['RA-5(1)', 'SI-2(1)']},
  // CKV2_AZURE_40: Ensure storage account is not configured with Shared Key authorization
  'CKV2_AZURE_40': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_41: Ensure storage account is configured with SAS expiration policy
  'CKV2_AZURE_41': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_42: Ensure Azure PostgreSQL server is configured with private endpoint
  'CKV2_AZURE_42': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_43: Ensure Azure MariaDB server is configured with private endpoint
  'CKV2_AZURE_43': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_44: Ensure Azure MySQL server is configured with private endpoint
  'CKV2_AZURE_44': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_45: Ensure Microsoft SQL server is configured with private endpoint
  'CKV2_AZURE_45': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_46: Ensure that Azure Synapse Workspace vulnerability assessment is enabled
  'CKV2_AZURE_46': {cci: ['CCI-001645'], nist: ['RA-5(2)']},
  // CKV2_AZURE_47: Ensure storage account is configured without blob anonymous access
  'CKV2_AZURE_47': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_48: Ensure that Databricks Workspaces enables customer-managed key for root DBFS ...
  'CKV2_AZURE_48': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_AZURE_49: Ensure that Azure Machine learning workspace is not configured with overly pe...
  'CKV2_AZURE_49': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_5: Ensure that VA setting 'Also send email notifications to admins and subscript...
  'CKV2_AZURE_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_50: Ensure Azure Storage Account storing Machine Learning workspace high business...
  'CKV2_AZURE_50': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV2_AZURE_51: Ensure Synapse SQL Pool has a security alert policy
  'CKV2_AZURE_51': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_52: Ensure Synapse SQL Pool has vulnerability assessment attached
  'CKV2_AZURE_52': {cci: ['CCI-001645'], nist: ['RA-5(2)']},
  // CKV2_AZURE_53: Ensure Azure Synapse Workspace has extended audit logs
  'CKV2_AZURE_53': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_AZURE_54: Ensure log monitoring is enabled for Synapse SQL Pool
  'CKV2_AZURE_54': {cci: ['CCI-000135', 'CCI-000169'], nist: ['AU-3(1)', 'AU-12']},
  // CKV2_AZURE_55: Ensure Azure Spring Cloud app end-to-end TLS is enabled
  'CKV2_AZURE_55': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_AZURE_56: Ensure Azure MySQL Flexible Server is configured with private endpoint
  'CKV2_AZURE_56': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_57: Ensure PostgreSQL Flexible Server is configured with private endpoint
  'CKV2_AZURE_57': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_AZURE_6: Ensure 'Allow access to Azure services' for PostgreSQL Database Server is dis...
  'CKV2_AZURE_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_7: Ensure that Azure Active Directory Admin is configured
  'CKV2_AZURE_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_AZURE_8: Ensure the storage container storing the activity logs is not publicly access...
  'CKV2_AZURE_8': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV2_AZURE_9: Ensure Virtual Machines are utilizing Managed Disks
  'CKV2_AZURE_9': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_DOCKER_1: Ensure that sudo isn't used
  'CKV2_DOCKER_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_DOCKER_10: Ensure that packages with untrusted or missing signatures are not used by rpm...
  'CKV2_DOCKER_10': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV2_DOCKER_11: Ensure that the '--force-yes' option is not used, as it disables signature va...
  'CKV2_DOCKER_11': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV2_DOCKER_12: Ensure that certificate validation isn't disabled for npm via the 'NPM_CONFIG...
  'CKV2_DOCKER_12': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_13: Ensure that certificate validation isn't disabled for npm or yarn by setting ...
  'CKV2_DOCKER_13': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_14: Ensure that certificate validation isn't disabled for git by setting the envi...
  'CKV2_DOCKER_14': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_15: Ensure that the yum and dnf package managers are not configured to disable SS...
  'CKV2_DOCKER_15': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV2_DOCKER_16: Ensure that certificate validation isn't disabled with pip via the 'PIP_TRUST...
  'CKV2_DOCKER_16': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_17: Ensure that 'chpasswd' is not used to set or remove passwords
  'CKV2_DOCKER_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_DOCKER_2: Ensure that certificate validation isn't disabled with curl
  'CKV2_DOCKER_2': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_3: Ensure that certificate validation isn't disabled with wget
  'CKV2_DOCKER_3': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_4: Ensure that certificate validation isn't disabled with the pip '--trusted-hos...
  'CKV2_DOCKER_4': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_5: Ensure that certificate validation isn't disabled with the PYTHONHTTPSVERIFY ...
  'CKV2_DOCKER_5': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_6: Ensure that certificate validation isn't disabled with the NODE_TLS_REJECT_UN...
  'CKV2_DOCKER_6': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV2_DOCKER_7: Ensure that packages with untrusted or missing signatures are not used by apk...
  'CKV2_DOCKER_7': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV2_DOCKER_8: Ensure that packages with untrusted or missing signatures are not used by apt...
  'CKV2_DOCKER_8': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV2_DOCKER_9: Ensure that packages with untrusted or missing GPG signatures are not used by...
  'CKV2_DOCKER_9': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV2_GCP_1: Ensure GKE clusters are not running using the Compute Engine default service ...
  'CKV2_GCP_1': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV2_GCP_10: Ensure GCP Cloud Function HTTP trigger is secured
  'CKV2_GCP_10': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_11: Ensure GCP GCR Container Vulnerability Scanning is enabled
  'CKV2_GCP_11': {cci: ['CCI-001645'], nist: ['RA-5(2)']},
  // CKV2_GCP_12: Ensure GCP compute firewall ingress does not allow unrestricted access to all...
  'CKV2_GCP_12': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV2_GCP_13: Ensure PostgreSQL database flag 'log_duration' is set to 'on'
  'CKV2_GCP_13': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_14: Ensure PostgreSQL database flag 'log_executor_stats' is set to 'off'
  'CKV2_GCP_14': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_15: Ensure PostgreSQL database flag 'log_parser_stats' is set to 'off'
  'CKV2_GCP_15': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_16: Ensure PostgreSQL database flag 'log_planner_stats' is set to 'off'
  'CKV2_GCP_16': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_17: Ensure PostgreSQL database flag 'log_statement_stats' is set to 'off'
  'CKV2_GCP_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_18: Ensure GCP network defines a firewall and does not use the default firewall
  'CKV2_GCP_18': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV2_GCP_19: Ensure GCP Kubernetes engine clusters have 'alpha cluster' feature disabled
  'CKV2_GCP_19': {cci: ['CCI-001521'], nist: ['CM-7(2)']},
  // CKV2_GCP_2: Ensure legacy networks do not exist for a project
  'CKV2_GCP_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_20: Ensure MySQL DB instance has point-in-time recovery backup configured
  'CKV2_GCP_20': {cci: ['CCI-000510'], nist: ['CP-9(1)']},
  // CKV2_GCP_21: Ensure Vertex AI instance disks are encrypted with a Customer Managed Key (CMK)
  'CKV2_GCP_21': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_22: Ensure Document AI Processors are encrypted with a Customer Managed Key (CMK)
  'CKV2_GCP_22': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_23: Ensure Document AI Warehouse Location is configured to use a Customer Managed...
  'CKV2_GCP_23': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_24: Ensure Vertex AI endpoint uses a Customer Managed Key (CMK)
  'CKV2_GCP_24': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_25: Ensure Vertex AI featurestore uses a Customer Managed Key (CMK)
  'CKV2_GCP_25': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_26: Ensure Vertex AI tensorboard uses a Customer Managed Key (CMK)
  'CKV2_GCP_26': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_27: Ensure Vertex AI workbench instance disks are encrypted with a Customer Manag...
  'CKV2_GCP_27': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_28: Ensure Vertex AI workbench instances are private
  'CKV2_GCP_28': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_29: Ensure logging is enabled for Dialogflow agents
  'CKV2_GCP_29': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_GCP_3: Ensure that there are only GCP-managed service account keys for each service ...
  'CKV2_GCP_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_30: Ensure logging is enabled for Dialogflow CX agents
  'CKV2_GCP_30': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_GCP_31: Ensure logging is enabled for Dialogflow CX webhooks
  'CKV2_GCP_31': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_GCP_32: Ensure TPU v2 is private
  'CKV2_GCP_32': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_33: Ensure Vertex AI endpoint is private
  'CKV2_GCP_33': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_34: Ensure Vertex AI index endpoint is private
  'CKV2_GCP_34': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_35: Ensure Vertex AI runtime is encrypted with a Customer Managed Key (CMK)
  'CKV2_GCP_35': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_36: Ensure Vertex AI runtime is private
  'CKV2_GCP_36': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_GCP_37: Ensure GCP compute regional forwarding rule does not use HTTP proxies with EX...
  'CKV2_GCP_37': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_38: Ensure GCP compute global forwarding rule does not use HTTP proxies with EXTE...
  'CKV2_GCP_38': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_4: Ensure that retention policies on log buckets are configured using Bucket Lock
  'CKV2_GCP_4': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_GCP_5: Ensure that Cloud Audit Logging is configured properly across all services an...
  'CKV2_GCP_5': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV2_GCP_6: Ensure that Cloud KMS cryptokeys are not anonymously or publicly accessible
  'CKV2_GCP_6': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_7: Ensure that a MySQL database instance does not allow anyone to connect with a...
  'CKV2_GCP_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GCP_8: Ensure that Cloud KMS Key Rings are not anonymously or publicly accessible
  'CKV2_GCP_8': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV2_GCP_9: Ensure that Container Registry repositories are not anonymously or publicly a...
  'CKV2_GCP_9': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV2_GHA_1: Ensure top-level permissions are not set to write-all
  'CKV2_GHA_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_GIT_1: Ensure each Repository has branch protection associated
  'CKV2_GIT_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_IBM_1: Ensure load balancer for VPC is private (disable public access)
  'CKV2_IBM_1': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_IBM_2: Ensure VPC classic access is disabled
  'CKV2_IBM_2': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_IBM_3: Ensure API key creation is restricted in account settings
  'CKV2_IBM_3': {cci: ['CCI-000018', 'CCI-000192'], nist: ['AC-2(3)', 'IA-5(1)']},
  // CKV2_IBM_4: Ensure Multi-Factor Authentication (MFA) is enabled at the account level
  'CKV2_IBM_4': {cci: ['CCI-000765', 'CCI-000766'], nist: ['IA-2(1)', 'IA-2(2)']},
  // CKV2_IBM_5: Ensure Service ID creation is restricted in account settings
  'CKV2_IBM_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_IBM_7: Ensure Kubernetes clusters are accessible by using private endpoint and NOT p...
  'CKV2_IBM_7': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV2_K8S_1: RoleBinding should not allow privilege escalation to a ServiceAccount or Node...
  'CKV2_K8S_1': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV2_K8S_2: Granting `create` permissions to `nodes/proxy` or `pods/exec` sub resources a...
  'CKV2_K8S_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_K8S_3: No ServiceAccount/Node should have `impersonate` permissions for groups/users...
  'CKV2_K8S_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_K8S_4: ServiceAccounts and nodes that can modify services/status may set the `status...
  'CKV2_K8S_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_K8S_5: No ServiceAccount/Node should be able to read all secrets
  'CKV2_K8S_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_K8S_6: Minimize the admission of pods which lack an associated NetworkPolicy
  'CKV2_K8S_6': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV2_OCI_1: Ensure administrator users are not associated with API keys
  'CKV2_OCI_1': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV2_OCI_2: Ensure NSG does not allow all traffic on RDP port (3389)
  'CKV2_OCI_2': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV2_OCI_3: Ensure Kubernetes engine cluster is configured with NSG(s)
  'CKV2_OCI_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV2_OCI_4: Ensure File Storage File System access is restricted to root users
  'CKV2_OCI_4': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV2_OCI_5: Ensure Kubernetes Engine Cluster boot volume is configured with in-transit da...
  'CKV2_OCI_5': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV2_OCI_6: Ensure Kubernetes Engine Cluster pod security policy is enforced
  'CKV2_OCI_6': {cci: ['CCI-001521', 'CCI-000235'], nist: ['CM-7(2)', 'AC-6(10)']},
  // CKV_ALI_1: Alibaba Cloud OSS bucket accessible to public
  'CKV_ALI_1': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_ALI_10: Ensure OSS bucket has versioning enabled
  'CKV_ALI_10': {cci: ['CCI-000510', 'CCI-000164'], nist: ['CP-9(1)', 'AU-9(2)']},
  // CKV_ALI_11: Ensure OSS bucket has transfer Acceleration enabled
  'CKV_ALI_11': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_12: Ensure the OSS bucket has access logging enabled
  'CKV_ALI_12': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_ALI_13: Ensure RAM password policy requires minimum length of 14 or greater
  'CKV_ALI_13': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_ALI_14: Ensure RAM password policy requires at least one number
  'CKV_ALI_14': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_ALI_15: Ensure RAM password policy requires at least one symbol
  'CKV_ALI_15': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_ALI_16: Ensure RAM password policy expires passwords within 90 days or less
  'CKV_ALI_16': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_ALI_17: Ensure RAM password policy requires at least one lowercase letter
  'CKV_ALI_17': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_ALI_18: Ensure RAM password policy prevents password reuse
  'CKV_ALI_18': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_ALI_19: Ensure RAM password policy requires at least one uppercase letter
  'CKV_ALI_19': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_ALI_2: Ensure no security groups allow ingress from 0.0.0.0:0 to port 22
  'CKV_ALI_2': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_ALI_20: Ensure RDS instance uses SSL
  'CKV_ALI_20': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_21: Ensure API Gateway API Protocol HTTPS
  'CKV_ALI_21': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_22: Ensure Transparent Data Encryption is Enabled on instance
  'CKV_ALI_22': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_ALI_23: Ensure Ram Account Password Policy Max Login Attempts not > 5
  'CKV_ALI_23': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_ALI_24: Ensure RAM enforces MFA
  'CKV_ALI_24': {cci: ['CCI-000765', 'CCI-000766'], nist: ['IA-2(1)', 'IA-2(2)']},
  // CKV_ALI_25: Ensure RDS Instance SQL Collector Retention Period should be greater than 180
  'CKV_ALI_25': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_26: Ensure Kubernetes installs plugin Terway or Flannel to support standard policies
  'CKV_ALI_26': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_27: Ensure KMS Key Rotation is enabled
  'CKV_ALI_27': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_ALI_28: Ensure KMS Keys are enabled
  'CKV_ALI_28': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_ALI_29: Alibaba ALB ACL does not restrict Access
  'CKV_ALI_29': {cci: ['CCI-001104', 'CCI-000172'], nist: ['SC-7(9)', 'AU-12(1)']},
  // CKV_ALI_3: Ensure no security groups allow ingress from 0.0.0.0:0 to port 3389
  'CKV_ALI_3': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_ALI_30: Ensure RDS instance auto upgrades for minor versions
  'CKV_ALI_30': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_31: Ensure K8s nodepools are set to auto repair
  'CKV_ALI_31': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_32: Ensure launch template data disks are encrypted
  'CKV_ALI_32': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_ALI_33: Alibaba Cloud Cypher Policy are secure
  'CKV_ALI_33': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_35: Ensure RDS instance has log_duration enabled
  'CKV_ALI_35': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_36: Ensure RDS instance has log_disconnections enabled
  'CKV_ALI_36': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_37: Ensure RDS instance has log_connections enabled
  'CKV_ALI_37': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_38: Ensure log audit is enabled for RDS
  'CKV_ALI_38': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_ALI_4: Ensure Action Trail Logging for all regions
  'CKV_ALI_4': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_ALI_41: Ensure MongoDB is deployed inside a VPC
  'CKV_ALI_41': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_ALI_42: Ensure Mongodb instance uses SSL
  'CKV_ALI_42': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ALI_43: Ensure MongoDB instance is not public
  'CKV_ALI_43': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_ALI_44: Ensure MongoDB has Transparent Data Encryption Enabled
  'CKV_ALI_44': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_ALI_5: Ensure Action Trail Logging for all events
  'CKV_ALI_5': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_ALI_6: Ensure OSS bucket is encrypted with Customer Master Key
  'CKV_ALI_6': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_ALI_7: Ensure disk is encrypted
  'CKV_ALI_7': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_ALI_8: Ensure Disk is encrypted with Customer Master Key
  'CKV_ALI_8': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_ALI_9: Ensure database instance is not public
  'CKV_ALI_9': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_ANSIBLE_1: Ensure that certificate validation isn't disabled with uri
  'CKV_ANSIBLE_1': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV_ANSIBLE_2: Ensure that certificate validation isn't disabled with get_url
  'CKV_ANSIBLE_2': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV_ANSIBLE_3: Ensure that certificate validation isn't disabled with yum
  'CKV_ANSIBLE_3': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV_ANSIBLE_4: Ensure that SSL validation isn't disabled with yum
  'CKV_ANSIBLE_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_ANSIBLE_5: Ensure that packages with untrusted or missing signatures are not used
  'CKV_ANSIBLE_5': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_ANSIBLE_6: Ensure that the force parameter is not used, as it disables signature validat...
  'CKV_ANSIBLE_6': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_ARGO_1: Ensure Workflow pods are not using the default ServiceAccount
  'CKV_ARGO_1': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_ARGO_2: Ensure Workflow pods are running as non-root user
  'CKV_ARGO_2': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AWS_1: Ensure IAM policies that allow full "*-*" administrative privileges are not c...
  'CKV_AWS_1': {cci: ['CCI-000235', 'CCI-000226'], nist: ['AC-6(10)', 'AC-6(1)']},
  // CKV_AWS_10: Ensure IAM password policy requires minimum length of 14 or greater
  'CKV_AWS_10': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_AWS_100: Ensure AWS EKS node group does not have implicit SSH access from 0.0.0.0/0
  'CKV_AWS_100': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_AWS_101: Ensure Neptune logging is enabled
  'CKV_AWS_101': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_102: Ensure Neptune Cluster instance is not publicly available
  'CKV_AWS_102': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_103: Ensure that Load Balancer Listener is using at least TLS v1.2
  'CKV_AWS_103': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_AWS_104: Ensure DocumentDB has audit logs enabled
  'CKV_AWS_104': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_105: Ensure Redshift uses SSL
  'CKV_AWS_105': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_106: Ensure EBS default encryption is enabled
  'CKV_AWS_106': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_107: Ensure IAM policies does not allow credentials exposure
  'CKV_AWS_107': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_108: Ensure IAM policies does not allow data exfiltration
  'CKV_AWS_108': {cci: ['CCI-002476', 'CCI-001821'], nist: ['SC-28(1)', 'MP-4']},
  // CKV_AWS_109: Ensure IAM policies does not allow permissions management without constraints
  'CKV_AWS_109': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_11: Ensure IAM password policy requires at least one lowercase letter
  'CKV_AWS_11': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_AWS_110: Ensure IAM policies does not allow privilege escalation
  'CKV_AWS_110': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_111: Ensure IAM policies does not allow write access without constraints
  'CKV_AWS_111': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_112: Ensure Session Manager data is encrypted in transit
  'CKV_AWS_112': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AWS_113: Ensure Session Manager logs are enabled and encrypted
  'CKV_AWS_113': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_114: Ensure that EMR clusters with Kerberos have Kerberos Realm set
  'CKV_AWS_114': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_115: Ensure that AWS Lambda function is configured for function-level concurrent e...
  'CKV_AWS_115': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_116: Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)
  'CKV_AWS_116': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_117: Ensure that AWS Lambda function is configured inside a VPC
  'CKV_AWS_117': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_118: Ensure that enhanced monitoring is enabled for Amazon RDS instances
  'CKV_AWS_118': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_119: Ensure DynamoDB Tables are encrypted using a KMS Customer Managed CMK
  'CKV_AWS_119': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_12: Ensure IAM password policy requires at least one number
  'CKV_AWS_12': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_AWS_120: Ensure API Gateway caching is enabled
  'CKV_AWS_120': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_AWS_121: Ensure AWS Config is enabled in all regions
  'CKV_AWS_121': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_122: Ensure that direct internet access is disabled for an Amazon SageMaker Notebo...
  'CKV_AWS_122': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_123: Ensure that VPC Endpoint Service is configured for Manual Acceptance
  'CKV_AWS_123': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_124: Ensure that CloudFormation stacks are sending event notifications to an SNS t...
  'CKV_AWS_124': {cci: ['CCI-002687', 'CCI-000229'], nist: ['SI-4(5)', 'IR-6(1)']},
  // CKV_AWS_126: Ensure that detailed monitoring is enabled for EC2 instances
  'CKV_AWS_126': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_127: Ensure that Elastic Load Balancer(s) uses SSL certificates provided by AWS Ce...
  'CKV_AWS_127': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV_AWS_129: Ensure that respective logs of Amazon Relational Database Service (Amazon RDS...
  'CKV_AWS_129': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_13: Ensure IAM password policy prevents password reuse
  'CKV_AWS_13': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_AWS_130: Ensure VPC subnets do not assign public IP by default
  'CKV_AWS_130': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_131: Ensure that ALB drops HTTP headers
  'CKV_AWS_131': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_133: Ensure that RDS instances has backup policy
  'CKV_AWS_133': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_134: Ensure that Amazon ElastiCache Redis clusters have automatic backup turned on
  'CKV_AWS_134': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_135: Ensure that EC2 is EBS optimized
  'CKV_AWS_135': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_136: Ensure that ECR repositories are encrypted using KMS
  'CKV_AWS_136': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_137: Ensure that Elasticsearch is configured inside a VPC
  'CKV_AWS_137': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_138: Ensure that ELB is cross-zone-load-balancing enabled
  'CKV_AWS_138': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_139: Ensure that RDS clusters have deletion protection enabled
  'CKV_AWS_139': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_14: Ensure IAM password policy requires at least one symbol
  'CKV_AWS_14': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_AWS_140: Ensure that RDS global clusters are encrypted
  'CKV_AWS_140': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_141: Ensured that Redshift cluster allowing version upgrade by default
  'CKV_AWS_141': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AWS_142: Ensure that Redshift cluster is encrypted by KMS
  'CKV_AWS_142': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_143: Ensure that S3 bucket has lock configuration enabled by default
  'CKV_AWS_143': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_144: Ensure that S3 bucket has cross-region replication enabled
  'CKV_AWS_144': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AWS_145: Ensure that S3 buckets are encrypted with KMS by default
  'CKV_AWS_145': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_146: Ensure that RDS database cluster snapshot is encrypted
  'CKV_AWS_146': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_147: Ensure that CodeBuild projects are encrypted using CMK
  'CKV_AWS_147': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_148: Ensure no default VPC is planned to be provisioned
  'CKV_AWS_148': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_149: Ensure that Secrets Manager secret is encrypted using KMS CMK
  'CKV_AWS_149': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_15: Ensure IAM password policy requires at least one uppercase letter
  'CKV_AWS_15': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_AWS_150: Ensure that Load Balancer has deletion protection enabled
  'CKV_AWS_150': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_152: Ensure that Load Balancer (Network/Gateway) has cross-zone load balancing ena...
  'CKV_AWS_152': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_153: Autoscaling groups should supply tags to launch configurations
  'CKV_AWS_153': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_154: Ensure Redshift is not deployed outside of a VPC
  'CKV_AWS_154': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_155: Ensure that Workspace user volumes are encrypted
  'CKV_AWS_155': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_156: Ensure that Workspace root volumes are encrypted
  'CKV_AWS_156': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_157: Ensure that RDS instances have Multi-AZ enabled
  'CKV_AWS_157': {cci: ['CCI-000555', 'CCI-000509'], nist: ['CP-10(2)', 'CP-9']},
  // CKV_AWS_158: Ensure that CloudWatch Log Group is encrypted by KMS
  'CKV_AWS_158': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_159: Ensure that Athena Workgroup is encrypted
  'CKV_AWS_159': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_16: Ensure all data stored in the RDS is securely encrypted at rest
  'CKV_AWS_16': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_160: Ensure that Timestream database is encrypted with KMS CMK
  'CKV_AWS_160': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_161: Ensure RDS database has IAM authentication enabled
  'CKV_AWS_161': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_162: Ensure RDS cluster has IAM authentication enabled
  'CKV_AWS_162': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_163: Ensure ECR image scanning on push is enabled
  'CKV_AWS_163': {cci: ['CCI-001644', 'CCI-002606'], nist: ['RA-5(1)', 'SI-2(1)']},
  // CKV_AWS_164: Ensure Transfer Server is not exposed publicly.
  'CKV_AWS_164': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_165: Ensure DynamoDB global table point in time recovery (backup) is enabled
  'CKV_AWS_165': {cci: ['CCI-000510'], nist: ['CP-9(1)']},
  // CKV_AWS_166: Ensure Backup Vault is encrypted at rest using KMS CMK
  'CKV_AWS_166': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_167: Ensure Glacier Vault access policy is not public by only allowing specific se...
  'CKV_AWS_167': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_168: Ensure SQS queue policy is not public by only allowing specific services or p...
  'CKV_AWS_168': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_169: Ensure SNS topic policy is not public by only allowing specific services or p...
  'CKV_AWS_169': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_17: Ensure all data stored in RDS is not publicly accessible
  'CKV_AWS_17': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_170: Ensure QLDB ledger permissions mode is set to STANDARD
  'CKV_AWS_170': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_171: Ensure EMR Cluster security configuration encryption is using SSE-KMS
  'CKV_AWS_171': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_172: Ensure QLDB ledger has deletion protection enabled
  'CKV_AWS_172': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_173: Check encryption settings for Lambda environment variable
  'CKV_AWS_173': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_AWS_174: Verify CloudFront Distribution Viewer Certificate is using TLS v1.2 or higher
  'CKV_AWS_174': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_AWS_175: Ensure WAF has associated rules
  'CKV_AWS_175': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AWS_176: Ensure Logging is enabled for WAF Web Access Control Lists
  'CKV_AWS_176': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AWS_177: Ensure Kinesis Video Stream is encrypted by KMS using a customer managed Key ...
  'CKV_AWS_177': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_178: Ensure fx ontap file system is encrypted by KMS using a customer managed Key ...
  'CKV_AWS_178': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_179: Ensure FSX Windows filesystem is encrypted by KMS using a customer managed Ke...
  'CKV_AWS_179': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_18: Ensure the S3 bucket has access logging enabled
  'CKV_AWS_18': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_180: Ensure Image Builder component is encrypted by KMS using a customer managed K...
  'CKV_AWS_180': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_181: Ensure S3 Object Copy is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_181': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_182: Ensure DocumentDB is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_182': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_183: Ensure EBS Snapshot Copy is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_183': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_184: Ensure resource is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_184': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_185: Ensure Kinesis Stream is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_185': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_186: Ensure S3 bucket Object is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_186': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_187: Ensure Sagemaker domain and notebook instance are encrypted by KMS using a cu...
  'CKV_AWS_187': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_189: Ensure EBS Volume is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_189': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_19: Ensure the S3 bucket has server-side-encryption enabled
  'CKV_AWS_19': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_190: Ensure lustre file systems is encrypted by KMS using a customer managed Key (...
  'CKV_AWS_190': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_191: Ensure ElastiCache replication group is encrypted by KMS using a customer man...
  'CKV_AWS_191': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_192: Ensure WAF prevents message lookup in Log4j2. See CVE-2021-44228 aka log4jshell
  'CKV_AWS_192': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AWS_193: Ensure AppSync has Logging enabled
  'CKV_AWS_193': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_194: Ensure AppSync has Field-Level logs enabled
  'CKV_AWS_194': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_195: Ensure Glue component has a security configuration associated
  'CKV_AWS_195': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_196: Ensure no aws_elasticache_security_group resources exist
  'CKV_AWS_196': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_197: Ensure MQ Broker Audit logging is enabled
  'CKV_AWS_197': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_198: Ensure no aws_db_security_group resources exist
  'CKV_AWS_198': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_199: Ensure Image Builder Distribution Configuration encrypts AMI's using KMS - a ...
  'CKV_AWS_199': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_2: Ensure ALB protocol is HTTPS
  'CKV_AWS_2': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV_AWS_20: Ensure the S3 bucket does not allow READ permissions to everyone
  'CKV_AWS_20': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_200: Ensure that Image Recipe EBS Disk are encrypted with CMK
  'CKV_AWS_200': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_201: Ensure MemoryDB is encrypted at rest using KMS CMKs
  'CKV_AWS_201': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_202: Ensure MemoryDB data is encrypted in transit
  'CKV_AWS_202': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AWS_203: Ensure resource is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_203': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_204: Ensure AMIs are encrypted using KMS CMKs
  'CKV_AWS_204': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_205: Ensure to Limit AMI launch Permissions
  'CKV_AWS_205': {cci: ['CCI-000213'], nist: ['AC-3']},
  // CKV_AWS_206: Ensure API Gateway Domain uses a modern security Policy
  'CKV_AWS_206': {cci: ['CCI-001099'], nist: ['SC-7(4)', 'SC-20']},
  // CKV_AWS_207: Ensure MQ Broker minor version updates are enabled
  'CKV_AWS_207': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_208: Ensure MQ Broker version is current
  'CKV_AWS_208': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_209: Ensure MQ broker encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_209': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_21: Ensure the S3 bucket has versioning enabled
  'CKV_AWS_21': {cci: ['CCI-000510', 'CCI-000164'], nist: ['CP-9(1)', 'AU-9(2)']},
  // CKV_AWS_210: Batch job does not define a privileged container
  'CKV_AWS_210': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_211: Ensure RDS uses a modern CaCert
  'CKV_AWS_211': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_212: Ensure DMS replication instance is encrypted by KMS using a customer managed ...
  'CKV_AWS_212': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_213: Ensure ELB Policy uses only secure protocols
  'CKV_AWS_213': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV_AWS_214: Ensure AppSync API Cache is encrypted at rest
  'CKV_AWS_214': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_215: Ensure AppSync API Cache is encrypted in transit
  'CKV_AWS_215': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AWS_216: Ensure CloudFront distribution is enabled
  'CKV_AWS_216': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_217: Ensure Create before destroy for API deployments
  'CKV_AWS_217': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_218: Ensure that CloudSearch is using latest TLS
  'CKV_AWS_218': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_219: Ensure CodePipeline Artifact store is using a KMS CMK
  'CKV_AWS_219': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_22: Ensure SageMaker Notebook is encrypted at rest using KMS CMK
  'CKV_AWS_22': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_220: Ensure that CloudSearch is using https
  'CKV_AWS_220': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_221: Ensure CodeArtifact Domain is encrypted by KMS using a customer managed Key (...
  'CKV_AWS_221': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_222: Ensure DMS replication instance gets all minor upgrade automatically
  'CKV_AWS_222': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AWS_223: Ensure ECS Cluster enables logging of ECS Exec
  'CKV_AWS_223': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_224: Ensure ECS Cluster logging is enabled and client to container communication u...
  'CKV_AWS_224': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_225: Ensure API Gateway method setting caching is enabled
  'CKV_AWS_225': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_AWS_226: Ensure DB instance gets all minor upgrades automatically
  'CKV_AWS_226': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_227: Ensure KMS key is enabled
  'CKV_AWS_227': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_228: Verify Elasticsearch domain is using an up to date TLS policy
  'CKV_AWS_228': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_AWS_229: Ensure no NACL allow ingress from 0.0.0.0:0 to port 21
  'CKV_AWS_229': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_23: Ensure every security groups rule has a description
  'CKV_AWS_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_230: Ensure no NACL allow ingress from 0.0.0.0:0 to port 20
  'CKV_AWS_230': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_231: Ensure no NACL allow ingress from 0.0.0.0:0 to port 3389
  'CKV_AWS_231': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_232: Ensure no NACL allow ingress from 0.0.0.0:0 to port 22
  'CKV_AWS_232': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_233: Ensure Create before destroy for ACM certificates
  'CKV_AWS_233': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_234: Verify logging preference for ACM certificates
  'CKV_AWS_234': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_235: Ensure that copied AMIs are encrypted
  'CKV_AWS_235': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_236: Ensure AMI copying uses a CMK
  'CKV_AWS_236': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_237: Ensure Create before destroy for API Gateway
  'CKV_AWS_237': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_238: Ensure that GuardDuty detector is enabled
  'CKV_AWS_238': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AWS_239: Ensure DAX cluster endpoint is using TLS
  'CKV_AWS_239': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_24: Ensure no security groups allow ingress from 0.0.0.0:0 to port 22
  'CKV_AWS_24': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_240: Ensure Kinesis Firehose delivery stream is encrypted
  'CKV_AWS_240': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_241: Ensure that Kinesis Firehose Delivery Streams are encrypted with CMK
  'CKV_AWS_241': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_242: Ensure MWAA environment has scheduler logs enabled
  'CKV_AWS_242': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_243: Ensure MWAA environment has worker logs enabled
  'CKV_AWS_243': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_244: Ensure MWAA environment has webserver logs enabled
  'CKV_AWS_244': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_245: Ensure replicated backups are encrypted at rest using KMS CMKs
  'CKV_AWS_245': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_246: Ensure RDS Cluster activity streams are encrypted using KMS CMKs
  'CKV_AWS_246': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_247: Ensure all data stored in the Elasticsearch is encrypted with a CMK
  'CKV_AWS_247': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_248: Ensure that Elasticsearch is not using the default Security Group
  'CKV_AWS_248': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_249: Ensure that the Execution Role ARN and the Task Role ARN are different in ECS...
  'CKV_AWS_249': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_25: Ensure no security groups allow ingress from 0.0.0.0:0 to port 3389
  'CKV_AWS_25': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_250: Ensure that RDS PostgreSQL instances use a non vulnerable version with the lo...
  'CKV_AWS_250': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_251: Ensure CloudTrail logging is enabled
  'CKV_AWS_251': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_AWS_252: Ensure CloudTrail defines an SNS Topic
  'CKV_AWS_252': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_AWS_253: Ensure DLM cross region events are encrypted
  'CKV_AWS_253': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AWS_254: Ensure DLM cross region events are encrypted with Customer Managed Key
  'CKV_AWS_254': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_255: Ensure DLM cross region schedules are encrypted
  'CKV_AWS_255': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AWS_256: Ensure DLM cross region schedules are encrypted using a Customer Managed Key
  'CKV_AWS_256': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_257: Ensure CodeCommit branch changes have at least 2 approvals
  'CKV_AWS_257': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_AWS_258: Ensure that Lambda function URLs AuthType is not None
  'CKV_AWS_258': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_259: Ensure CloudFront response header policy enforces Strict Transport Security
  'CKV_AWS_259': {cci: ['CCI-000227', 'CCI-001310'], nist: ['IR-4(1)', 'IR-5(1)']},
  // CKV_AWS_26: Ensure all data stored in the SNS topic is encrypted
  'CKV_AWS_26': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_260: Ensure no security groups allow ingress from 0.0.0.0:0 to port 80
  'CKV_AWS_260': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_261: Ensure HTTP HTTPS Target group defines Healthcheck
  'CKV_AWS_261': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_262: Ensure Kendra index Server side encryption uses CMK
  'CKV_AWS_262': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_263: Ensure AppFlow flow uses CMK
  'CKV_AWS_263': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_264: Ensure AppFlow connector profile uses CMK
  'CKV_AWS_264': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_265: Ensure Keyspaces Table uses CMK
  'CKV_AWS_265': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_266: Ensure DB Snapshot copy uses CMK
  'CKV_AWS_266': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_267: Ensure that Comprehend Entity Recognizer's model is encrypted by KMS using a ...
  'CKV_AWS_267': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_268: Ensure that Comprehend Entity Recognizer's volume is encrypted by KMS using a...
  'CKV_AWS_268': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_269: Ensure Connect Instance Kinesis Video Stream Storage Config uses CMK
  'CKV_AWS_269': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_27: Ensure all data stored in the SQS queue is encrypted
  'CKV_AWS_27': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_270: Ensure Connect Instance S3 Storage Config uses CMK
  'CKV_AWS_270': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_271: Ensure DynamoDB table replica KMS encryption uses CMK
  'CKV_AWS_271': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_272: Ensure AWS Lambda function is configured to validate code-signing
  'CKV_AWS_272': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_273: Ensure access is controlled through SSO and not AWS IAM defined users
  'CKV_AWS_273': {cci: ['CCI-001957', 'CCI-001954'], nist: ['IA-2(12)', 'IA-8(2)']},
  // CKV_AWS_274: Disallow IAM roles, users, and groups from using the AWS AdministratorAccess ...
  'CKV_AWS_274': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_275: Disallow policies from using the AWS AdministratorAccess policy
  'CKV_AWS_275': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_276: Ensure Data Trace is not enabled in API Gateway Method Settings
  'CKV_AWS_276': {cci: ['CCI-002684', 'CCI-000169'], nist: ['SI-4(2)', 'AU-12']},
  // CKV_AWS_277: Ensure no security groups allow ingress from 0.0.0.0:0 to port -1
  'CKV_AWS_277': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_278: Ensure MemoryDB snapshot is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_278': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_279: Ensure Neptune snapshot is securely encrypted
  'CKV_AWS_279': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_28: Ensure DynamoDB point in time recovery (backup) is enabled
  'CKV_AWS_28': {cci: ['CCI-000510'], nist: ['CP-9(1)']},
  // CKV_AWS_280: Ensure Neptune snapshot is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_280': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_281: Ensure RedShift snapshot copy is encrypted by KMS using a customer managed Ke...
  'CKV_AWS_281': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_282: Ensure that Redshift Serverless namespace is encrypted by KMS using a custome...
  'CKV_AWS_282': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_283: Ensure no IAM policies documents allow ALL or any AWS principal permissions t...
  'CKV_AWS_283': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_284: Ensure State Machine has X-Ray tracing enabled
  'CKV_AWS_284': {cci: ['CCI-002684', 'CCI-000169'], nist: ['SI-4(2)', 'AU-12']},
  // CKV_AWS_285: Ensure State Machine has execution history logging enabled
  'CKV_AWS_285': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_286: Ensure IAM policies does not allow privilege escalation
  'CKV_AWS_286': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_287: Ensure IAM policies does not allow credentials exposure
  'CKV_AWS_287': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_288: Ensure IAM policies does not allow data exfiltration
  'CKV_AWS_288': {cci: ['CCI-002476', 'CCI-001821'], nist: ['SC-28(1)', 'MP-4']},
  // CKV_AWS_289: Ensure IAM policies does not allow permissions management / resource exposure...
  'CKV_AWS_289': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_29: Ensure all data stored in the ElastiCache Replication Group is securely encry...
  'CKV_AWS_29': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_290: Ensure IAM policies does not allow write access without constraints
  'CKV_AWS_290': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_291: Ensure MSK nodes are private
  'CKV_AWS_291': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_292: Ensure DocumentDB Global Cluster is encrypted at rest (default is unencrypted)
  'CKV_AWS_292': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_293: Ensure that AWS database instances have deletion protection enabled
  'CKV_AWS_293': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_294: Ensure CloudTrail Event Data Store uses CMK
  'CKV_AWS_294': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_295: Ensure DataSync Location Object Storage doesn't expose secrets
  'CKV_AWS_295': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_296: Ensure DMS endpoint uses Customer Managed Key (CMK)
  'CKV_AWS_296': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_297: Ensure EventBridge Scheduler Schedule uses Customer Managed Key (CMK)
  'CKV_AWS_297': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_298: Ensure DMS S3 uses Customer Managed Key (CMK)
  'CKV_AWS_298': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_3: Ensure all data stored in the EBS is securely encrypted
  'CKV_AWS_3': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_30: Ensure all data stored in the ElastiCache Replication Group is securely encry...
  'CKV_AWS_30': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AWS_300: Ensure S3 lifecycle configuration sets period for aborting failed uploads
  'CKV_AWS_300': {cci: ['CCI-001904', 'CCI-000167'], nist: ['MP-6(1)', 'AU-11']},
  // CKV_AWS_301: Ensure that AWS Lambda function is not publicly accessible
  'CKV_AWS_301': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_302: Ensure DB Snapshots are not Public
  'CKV_AWS_302': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_AWS_303: Ensure SSM documents are not Public
  'CKV_AWS_303': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_AWS_304: Ensure Secrets Manager secrets should be rotated within 90 days
  'CKV_AWS_304': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_AWS_305: Ensure CloudFront distribution has a default root object configured
  'CKV_AWS_305': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_AWS_306: Ensure SageMaker notebook instances should be launched into a custom VPC
  'CKV_AWS_306': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_307: Ensure SageMaker Users should not have root access to SageMaker notebook inst...
  'CKV_AWS_307': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AWS_308: Ensure API Gateway method setting caching is set to encrypted
  'CKV_AWS_308': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_309: Ensure API GatewayV2 routes specify an authorization type
  'CKV_AWS_309': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_31: Ensure all data stored in the ElastiCache Replication Group is securely encry...
  'CKV_AWS_31': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AWS_310: Ensure CloudFront distributions should have origin failover configured
  'CKV_AWS_310': {cci: ['CCI-000555', 'CCI-000509'], nist: ['CP-10(2)', 'CP-9']},
  // CKV_AWS_311: Ensure that CodeBuild S3 logs are encrypted
  'CKV_AWS_311': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_312: Ensure Elastic Beanstalk environments have enhanced health reporting enabled
  'CKV_AWS_312': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_313: Ensure RDS cluster configured to copy tags to snapshots
  'CKV_AWS_313': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_314: Ensure CodeBuild project environments have a logging configuration
  'CKV_AWS_314': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_315: Ensure EC2 Auto Scaling groups use EC2 launch templates
  'CKV_AWS_315': {cci: ['CCI-000557', 'CCI-002386'], nist: ['CP-10(4)', 'SC-5(2)']},
  // CKV_AWS_316: Ensure CodeBuild project environments do not have privileged mode enabled
  'CKV_AWS_316': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_317: Ensure Elasticsearch Domain Audit Logging is enabled
  'CKV_AWS_317': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_318: Ensure Elasticsearch domains are configured with at least three dedicated mas...
  'CKV_AWS_318': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_319: Ensure that CloudWatch alarm actions are enabled
  'CKV_AWS_319': {cci: ['CCI-002687', 'CCI-000229'], nist: ['SI-4(5)', 'IR-6(1)']},
  // CKV_AWS_32: Ensure ECR policy is not set to public
  'CKV_AWS_32': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_AWS_320: Ensure Redshift clusters do not use the default database name
  'CKV_AWS_320': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_321: Ensure Redshift clusters use enhanced VPC routing
  'CKV_AWS_321': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_322: Ensure ElastiCache for Redis cache clusters have auto minor version upgrades ...
  'CKV_AWS_322': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_AWS_323: Ensure ElastiCache clusters do not use the default subnet group
  'CKV_AWS_323': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_324: Ensure that RDS Cluster log capture is enabled
  'CKV_AWS_324': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_325: Ensure that RDS Cluster audit logging is enabled for MySQL engine
  'CKV_AWS_325': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_326: Ensure that RDS Aurora Clusters have backtracking enabled
  'CKV_AWS_326': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_327: Ensure RDS Clusters are encrypted using KMS CMKs
  'CKV_AWS_327': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_328: Ensure that ALB is configured with defensive or strictest desync mitigation mode
  'CKV_AWS_328': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_329: EFS access points should enforce a root directory
  'CKV_AWS_329': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_33: Ensure KMS key policy does not contain wildcard (*) principal
  'CKV_AWS_33': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_331: Ensure Transit Gateways do not automatically accept VPC attachment requests
  'CKV_AWS_331': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_332: Ensure ECS Fargate services run on the latest Fargate platform version
  'CKV_AWS_332': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_333: Ensure ECS services do not have public IP addresses assigned to them automati...
  'CKV_AWS_333': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_334: Ensure ECS containers should run as non-privileged
  'CKV_AWS_334': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_335: Ensure ECS task definitions should not share the host's process namespace
  'CKV_AWS_335': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_336: Ensure ECS containers are limited to read-only access to root filesystems
  'CKV_AWS_336': {cci: ['CCI-001515', 'CCI-000166'], nist: ['CM-6(1)', 'AU-9(4)']},
  // CKV_AWS_337: Ensure SSM parameters are using KMS CMK
  'CKV_AWS_337': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_338: Ensure CloudWatch log groups retains logs for at least 1 year
  'CKV_AWS_338': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_339: Ensure EKS clusters run on a supported Kubernetes version
  'CKV_AWS_339': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_34: Ensure CloudFront Distribution ViewerProtocolPolicy is set to HTTPS
  'CKV_AWS_34': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_340: Ensure Elastic Beanstalk managed platform updates are enabled
  'CKV_AWS_340': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_341: Ensure Launch template should not have a metadata response hop limit greater ...
  'CKV_AWS_341': {cci: ['CCI-000227', 'CCI-001310'], nist: ['IR-4(1)', 'IR-5(1)']},
  // CKV_AWS_342: Ensure WAF rule has any actions
  'CKV_AWS_342': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AWS_343: Ensure Amazon Redshift clusters should have automatic snapshots enabled
  'CKV_AWS_343': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_344: Ensure that Network firewalls have deletion protection enabled
  'CKV_AWS_344': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_345: Ensure that Network firewall encryption is via a CMK
  'CKV_AWS_345': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_346: Ensure Network Firewall Policy defines an encryption configuration that uses ...
  'CKV_AWS_346': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_347: Ensure Neptune is encrypted by KMS using a customer managed Key (CMK)
  'CKV_AWS_347': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_348: Ensure IAM root user does not have Access keys
  'CKV_AWS_348': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AWS_349: Ensure EMR Cluster security configuration encrypts local disks
  'CKV_AWS_349': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_35: Ensure CloudTrail logs are encrypted at rest using KMS CMKs
  'CKV_AWS_35': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_350: Ensure EMR Cluster security configuration encrypts EBS disks
  'CKV_AWS_350': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_351: Ensure EMR Cluster security configuration encrypts InTransit
  'CKV_AWS_351': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_352: Ensure NACL ingress does not allow all Ports
  'CKV_AWS_352': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_353: Ensure that RDS instances have performance insights enabled
  'CKV_AWS_353': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_354: Ensure RDS Performance Insights are encrypted using KMS CMKs
  'CKV_AWS_354': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_355: Ensure no IAM policies documents allow "*" as a statement's resource for rest...
  'CKV_AWS_355': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_AWS_356: Ensure no IAM policies documents allow "*" as a statement's resource for rest...
  'CKV_AWS_356': {cci: ['CCI-000226'], nist: ['AC-6(1)']},
  // CKV_AWS_357: Ensure Transfer Server allows only secure protocols
  'CKV_AWS_357': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_358: Ensure AWS GitHub Actions OIDC authorization policies only allow safe claims ...
  'CKV_AWS_358': {cci: ['CCI-001957', 'CCI-001954'], nist: ['IA-2(12)', 'IA-8(2)']},
  // CKV_AWS_359: Neptune DB clusters should have IAM database authentication enabled
  'CKV_AWS_359': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_36: Ensure CloudTrail log file validation is enabled
  'CKV_AWS_36': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_AWS_360: Ensure DocumentDB has an adequate backup retention period
  'CKV_AWS_360': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_361: Ensure that Neptune DB cluster has automated backups enabled with adequate re...
  'CKV_AWS_361': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_362: Neptune DB clusters should be configured to copy tags to snapshots
  'CKV_AWS_362': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_363: Ensure Lambda Runtime is not deprecated
  'CKV_AWS_363': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_364: Ensure that AWS Lambda function permissions delegated to AWS services are lim...
  'CKV_AWS_364': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_365: Ensure SES Configuration Set enforces TLS usage
  'CKV_AWS_365': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_367: Ensure Amazon Sagemaker Data Quality Job uses KMS to encrypt model artifacts
  'CKV_AWS_367': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_368: Ensure Amazon Sagemaker Data Quality Job uses KMS to encrypt data on attached...
  'CKV_AWS_368': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_369: Ensure Amazon Sagemaker Data Quality Job encrypts all communications between ...
  'CKV_AWS_369': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_37: Ensure Amazon EKS control plane logging is enabled for all log types
  'CKV_AWS_37': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_370: Ensure Amazon SageMaker model uses network isolation
  'CKV_AWS_370': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AWS_371: Ensure Amazon SageMaker Notebook Instance only allows for IMDSv2
  'CKV_AWS_371': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_372: Ensure Amazon SageMaker Flow Definition uses KMS for output configurations
  'CKV_AWS_372': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_373: Ensure Bedrock Agent is encrypted with a CMK
  'CKV_AWS_373': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_374: Ensure AWS CloudFront web distribution has geo restriction enabled
  'CKV_AWS_374': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_375: Ensure AWS S3 bucket does not have global view ACL permissions enabled
  'CKV_AWS_375': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_376: Ensure AWS Elastic Load Balancer listener uses TLS/SSL
  'CKV_AWS_376': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV_AWS_377: Ensure Route 53 domains have transfer lock protection
  'CKV_AWS_377': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_378: Ensure AWS Load Balancer doesn't use HTTP protocol
  'CKV_AWS_378': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AWS_379: Ensure AWS S3 bucket is configured with secure data transport policy
  'CKV_AWS_379': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_38: Ensure Amazon EKS public endpoint not accessible to 0.0.0.0/0
  'CKV_AWS_38': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_380: Ensure AWS Transfer Server uses latest Security Policy
  'CKV_AWS_380': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_381: Make sure that aws_codegurureviewer_repository_association has a CMK
  'CKV_AWS_381': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AWS_382: Ensure no security groups allow egress from 0.0.0.0:0 to port -1
  'CKV_AWS_382': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AWS_383: Ensure AWS Bedrock agent is associated with Bedrock guardrails
  'CKV_AWS_383': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_384: Ensure no hard-coded secrets exist in Parameter Store values
  'CKV_AWS_384': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_AWS_385: Ensure AWS SNS topic policies do not allow cross-account access
  'CKV_AWS_385': {cci: ['CCI-001414', 'CCI-000213'], nist: ['AC-4(21)', 'AC-3']},
  // CKV_AWS_386: Reduce potential for WhoAMI cloud image name confusion attack
  'CKV_AWS_386': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_387: Ensure SQS policy does not allow public access through wildcards
  'CKV_AWS_387': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_388: Ensure AWS Aurora PostgreSQL is not exposed to local file read vulnerability
  'CKV_AWS_388': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_389: Ensure AWS Auto Scaling group launch configuration doesn't have public IP add...
  'CKV_AWS_389': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_39: Ensure Amazon EKS public endpoint disabled
  'CKV_AWS_39': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_390: Ensure AWS EMR block public access setting is enabled
  'CKV_AWS_390': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_391: Avoid AWS Redshift cluster with commonly used master username and public acce...
  'CKV_AWS_391': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_392: Ensure AWS S3 access point block public access setting is enabled
  'CKV_AWS_392': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_40: Ensure IAM policies are attached only to groups or roles (Reducing access man...
  'CKV_AWS_40': {cci: ['CCI-000235', 'CCI-000226'], nist: ['AC-6(10)', 'AC-6(1)']},
  // CKV_AWS_41: Ensure no hard coded AWS access key and secret key exists in provider
  'CKV_AWS_41': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_AWS_42: Ensure EFS is securely encrypted
  'CKV_AWS_42': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_43: Ensure Kinesis Stream is securely encrypted
  'CKV_AWS_43': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_44: Ensure Neptune storage is securely encrypted
  'CKV_AWS_44': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_45: Ensure no hard-coded secrets exist in Lambda environment
  'CKV_AWS_45': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_AWS_46: Ensure no hard-coded secrets exist in EC2 user data
  'CKV_AWS_46': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_AWS_47: Ensure DAX is encrypted at rest (default is unencrypted)
  'CKV_AWS_47': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_48: Ensure MQ Broker logging is enabled
  'CKV_AWS_48': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_49: Ensure no IAM policies documents allow "*" as a statement's actions
  'CKV_AWS_49': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_5: Ensure all data stored in the Elasticsearch is securely encrypted at rest
  'CKV_AWS_5': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_50: X-Ray tracing is enabled for Lambda
  'CKV_AWS_50': {cci: ['CCI-002684', 'CCI-000169'], nist: ['SI-4(2)', 'AU-12']},
  // CKV_AWS_51: Ensure ECR Image Tags are immutable
  'CKV_AWS_51': {cci: ['CCI-001648', 'CCI-002700'], nist: ['RA-5(5)', 'SI-7(1)']},
  // CKV_AWS_53: Ensure S3 bucket has block public ACLs enabled
  'CKV_AWS_53': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_AWS_54: Ensure S3 bucket has block public policy enabled
  'CKV_AWS_54': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_AWS_55: Ensure S3 bucket has ignore public ACLs enabled
  'CKV_AWS_55': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_AWS_56: Ensure S3 bucket has RestrictPublicBuckets enabled
  'CKV_AWS_56': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_57: Ensure the S3 bucket does not allow WRITE permissions to everyone
  'CKV_AWS_57': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_58: Ensure EKS Cluster has Secrets Encryption Enabled
  'CKV_AWS_58': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_59: Ensure there is no open access to back-end resources through API
  'CKV_AWS_59': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_6: Ensure all Elasticsearch has node-to-node encryption enabled
  'CKV_AWS_6': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_60: Ensure IAM role allows only specific services or principals to assume it
  'CKV_AWS_60': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_61: Ensure AWS IAM policy does not allow assume role permission across all services
  'CKV_AWS_61': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AWS_62: Ensure no IAM policies that allow full "*-*" administrative privileges are no...
  'CKV_AWS_62': {cci: ['CCI-000235', 'CCI-000226'], nist: ['AC-6(10)', 'AC-6(1)']},
  // CKV_AWS_63: Ensure no IAM policies documents allow "*" as a statement's actions
  'CKV_AWS_63': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_64: Ensure all data stored in the Redshift cluster is securely encrypted at rest
  'CKV_AWS_64': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_65: Ensure container insights are enabled on ECS cluster
  'CKV_AWS_65': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_66: Ensure that CloudWatch Log Group specifies retention days
  'CKV_AWS_66': {cci: ['CCI-000167'], nist: ['AU-11']},
  // CKV_AWS_67: Ensure CloudTrail is enabled in all Regions
  'CKV_AWS_67': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_AWS_68: CloudFront Distribution should have WAF enabled
  'CKV_AWS_68': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AWS_69: Ensure Amazon MQ Broker should not have public access
  'CKV_AWS_69': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_7: Ensure rotation for customer created CMKs is enabled
  'CKV_AWS_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_70: Ensure S3 bucket does not allow an action with any Principal
  'CKV_AWS_70': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_71: Ensure Redshift Cluster logging is enabled
  'CKV_AWS_71': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_72: Ensure SQS policy does not allow ALL (*) actions.
  'CKV_AWS_72': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_73: Ensure API Gateway has X-Ray Tracing enabled
  'CKV_AWS_73': {cci: ['CCI-002684', 'CCI-000169'], nist: ['SI-4(2)', 'AU-12']},
  // CKV_AWS_74: Ensure DocumentDB is encrypted at rest (default is unencrypted)
  'CKV_AWS_74': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_75: Ensure Global Accelerator accelerator has flow logs enabled
  'CKV_AWS_75': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_76: Ensure API Gateway has Access Logging enabled
  'CKV_AWS_76': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_77: Ensure Athena Database is encrypted at rest (default is unencrypted)
  'CKV_AWS_77': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_78: Ensure that CodeBuild Project encryption is not disabled
  'CKV_AWS_78': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_79: Ensure Instance Metadata Service Version 1 is not enabled
  'CKV_AWS_79': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_8: Ensure all data stored in the Launch configuration EBS is securely encrypted
  'CKV_AWS_8': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_AWS_80: Ensure MSK Cluster logging is enabled
  'CKV_AWS_80': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_81: Ensure MSK Cluster encryption in rest and transit is enabled
  'CKV_AWS_81': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_82: Ensure Athena Workgroup should enforce configuration to prevent client disabl...
  'CKV_AWS_82': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_83: Ensure Elasticsearch Domain enforces HTTPS
  'CKV_AWS_83': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_84: Ensure Elasticsearch Domain Logging is enabled
  'CKV_AWS_84': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_85: Ensure DocumentDB Logging is enabled
  'CKV_AWS_85': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_86: Ensure CloudFront Distribution has Access Logging enabled
  'CKV_AWS_86': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_87: Redshift cluster should not be publicly accessible
  'CKV_AWS_87': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_88: EC2 instance should not have public IP.
  'CKV_AWS_88': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_89: DMS replication instance should not be publicly accessible
  'CKV_AWS_89': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AWS_9: Ensure IAM password policy expires passwords within 90 days or less
  'CKV_AWS_9': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_AWS_90: Ensure DocumentDB TLS is not disabled
  'CKV_AWS_90': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AWS_91: Ensure the ELBv2 (Application/Network) has access logging enabled
  'CKV_AWS_91': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_92: Ensure the ELB has access logging enabled
  'CKV_AWS_92': {cci: ['CCI-001104', 'CCI-000172'], nist: ['SC-7(9)', 'AU-12(1)']},
  // CKV_AWS_93: Ensure S3 bucket policy does not lockout all but root user. (Prevent lockouts...
  'CKV_AWS_93': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AWS_94: Ensure Glue Data Catalog Encryption is enabled
  'CKV_AWS_94': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AWS_95: Ensure API Gateway V2 has Access Logging enabled
  'CKV_AWS_95': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AWS_96: Ensure all data stored in Aurora is securely encrypted at rest
  'CKV_AWS_96': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_97: Ensure Encryption in transit is enabled for EFS volumes in ECS Task definitions
  'CKV_AWS_97': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_98: Ensure all data stored in the Sagemaker Endpoint is securely encrypted at rest
  'CKV_AWS_98': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AWS_99: Ensure Glue Security Configuration Encryption is enabled
  'CKV_AWS_99': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZUREPIPELINES_1: Ensure container job uses a non latest version tag
  'CKV_AZUREPIPELINES_1': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZUREPIPELINES_2: Ensure container job uses a version digest
  'CKV_AZUREPIPELINES_2': {cci: ['CCI-001648', 'CCI-002700'], nist: ['RA-5(5)', 'SI-7(1)']},
  // CKV_AZUREPIPELINES_3: Ensure set variable is not marked as a secret
  'CKV_AZUREPIPELINES_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZUREPIPELINES_5: Detecting image usages in azure pipelines workflows
  'CKV_AZUREPIPELINES_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_1: Ensure Azure Instance does not use basic authentication(Use SSH Key Instead)
  'CKV_AZURE_1': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_AZURE_10: Ensure that SSH access is restricted from the internet
  'CKV_AZURE_10': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_AZURE_100: Ensure that Cosmos DB accounts have customer-managed keys to encrypt data at ...
  'CKV_AZURE_100': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AZURE_101: Ensure that Azure Cosmos DB disables public network access
  'CKV_AZURE_101': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_102: Ensure that PostgreSQL server enables geo-redundant backups
  'CKV_AZURE_102': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AZURE_103: Ensure that Azure Data Factory uses Git repository for source control
  'CKV_AZURE_103': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_104: Ensure that Azure Data factory public network access is disabled
  'CKV_AZURE_104': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_105: Ensure that Data Lake Store accounts enables encryption
  'CKV_AZURE_105': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_106: Ensure that Azure Event Grid Domain public network access is disabled
  'CKV_AZURE_106': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_107: Ensure that API management services use virtual networks
  'CKV_AZURE_107': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_108: Ensure that Azure IoT Hub disables public network access
  'CKV_AZURE_108': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_109: Ensure that key vault allows firewall rules settings
  'CKV_AZURE_109': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_AZURE_11: Ensure no SQL Databases allow ingress from 0.0.0.0/0 (ANY IP)
  'CKV_AZURE_11': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_AZURE_110: Ensure that key vault enables purge protection
  'CKV_AZURE_110': {cci: ['CCI-002452'], nist: ['SC-12(2)']},
  // CKV_AZURE_111: Ensure that key vault enables soft delete
  'CKV_AZURE_111': {cci: ['CCI-002452'], nist: ['SC-12(2)']},
  // CKV_AZURE_112: Ensure that key vault key is backed by HSM
  'CKV_AZURE_112': {cci: ['CCI-002452'], nist: ['SC-12(2)']},
  // CKV_AZURE_113: Ensure that SQL server disables public network access
  'CKV_AZURE_113': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_114: Ensure that key vault secrets have "content_type" set
  'CKV_AZURE_114': {cci: ['CCI-002452'], nist: ['SC-12(2)']},
  // CKV_AZURE_115: Ensure that AKS enables private clusters
  'CKV_AZURE_115': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AZURE_116: Ensure that AKS uses Azure Policies Add-on
  'CKV_AZURE_116': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_117: Ensure that AKS uses disk encryption set
  'CKV_AZURE_117': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AZURE_118: Ensure that Network Interfaces disable IP forwarding
  'CKV_AZURE_118': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_12: Ensure that Network Security Group Flow Log retention period is 'greater than...
  'CKV_AZURE_12': {cci: ['CCI-001104', 'CCI-000172'], nist: ['SC-7(9)', 'AU-12(1)']},
  // CKV_AZURE_120: Ensure that Application Gateway enables WAF
  'CKV_AZURE_120': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AZURE_121: Ensure that Azure Front Door enables WAF
  'CKV_AZURE_121': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AZURE_122: Ensure that Application Gateway uses WAF in "Detection" or "Prevention" modes
  'CKV_AZURE_122': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AZURE_123: Ensure that Azure Front Door uses WAF in "Detection" or "Prevention" modes
  'CKV_AZURE_123': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AZURE_124: Ensure that Azure Cognitive Search disables public network access
  'CKV_AZURE_124': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_125: Ensures that Service Fabric use three levels of protection available
  'CKV_AZURE_125': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_126: Ensures that Active Directory is used for authentication for Service Fabric
  'CKV_AZURE_126': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_127: Ensure that My SQL server enables Threat detection policy
  'CKV_AZURE_127': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_128: Ensure that PostgreSQL server enables Threat detection policy
  'CKV_AZURE_128': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_129: Ensure that MariaDB server enables geo-redundant backups
  'CKV_AZURE_129': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AZURE_13: Ensure App Service Authentication is set on Azure App Service
  'CKV_AZURE_13': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_130: Ensure that PostgreSQL server enables infrastructure encryption
  'CKV_AZURE_130': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_131: Ensure that 'Security contact emails' is set
  'CKV_AZURE_131': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_132: Ensure cosmosdb does not allow privileged escalation by restricting managemen...
  'CKV_AZURE_132': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_133: Ensure Front Door WAF prevents message lookup in Log4j2. See CVE-2021-44228 a...
  'CKV_AZURE_133': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AZURE_134: Ensure that Cognitive Services accounts disable public network access
  'CKV_AZURE_134': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_135: Ensure Application Gateway WAF prevents message lookup in Log4j2. See CVE-202...
  'CKV_AZURE_135': {cci: ['CCI-001109', 'CCI-002385'], nist: ['SC-7(14)', 'SC-5(1)']},
  // CKV_AZURE_136: Ensure that PostgreSQL Flexible server enables geo-redundant backups
  'CKV_AZURE_136': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AZURE_137: Ensure ACR admin account is disabled
  'CKV_AZURE_137': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AZURE_138: Ensures that ACR disables anonymous pulling of images
  'CKV_AZURE_138': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_139: Ensure ACR set to disable public networking
  'CKV_AZURE_139': {cci: ['CCI-000382'], nist: ['CM-7(1)']},
  // CKV_AZURE_14: Ensure web app redirects all HTTP traffic to HTTPS in Azure App Service
  'CKV_AZURE_14': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AZURE_140: Ensure that Local Authentication is disabled on CosmosDB
  'CKV_AZURE_140': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_141: Ensure AKS local admin account is disabled
  'CKV_AZURE_141': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AZURE_142: Ensure Machine Learning Compute Cluster Local Authentication is disabled
  'CKV_AZURE_142': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_143: Ensure AKS cluster nodes do not have public IP addresses
  'CKV_AZURE_143': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_144: Ensure that Public Access is disabled for Machine Learning Workspace
  'CKV_AZURE_144': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_145: Ensure Function app is using the latest version of TLS encryption
  'CKV_AZURE_145': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_146: Ensure server parameter 'log_retention' is set to 'ON' for PostgreSQL Databas...
  'CKV_AZURE_146': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_147: Ensure PostgreSQL is using the latest version of TLS encryption
  'CKV_AZURE_147': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_148: Ensure Redis Cache is using the latest version of TLS encryption
  'CKV_AZURE_148': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_149: Ensure that Virtual machine does not enable password authentication
  'CKV_AZURE_149': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_15: Ensure web app is using the latest version of TLS encryption
  'CKV_AZURE_15': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_150: Ensure Machine Learning Compute Cluster Minimum Nodes Set To 0
  'CKV_AZURE_150': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_151: Ensure Windows VM enables encryption
  'CKV_AZURE_151': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_152: Ensure Client Certificates are enforced for API management
  'CKV_AZURE_152': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_153: Ensure web app redirects all HTTP traffic to HTTPS in Azure App Service Slot
  'CKV_AZURE_153': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AZURE_154: Ensure the App service slot is using the latest version of TLS encryption
  'CKV_AZURE_154': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_155: Ensure debugging is disabled for the App service slot
  'CKV_AZURE_155': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_156: Ensure default Auditing policy for a SQL Server is configured to capture and ...
  'CKV_AZURE_156': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_157: Ensure that Synapse workspace has data_exfiltration_protection_enabled
  'CKV_AZURE_157': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_158: Ensure Databricks Workspace data plane to control plane communication happens...
  'CKV_AZURE_158': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AZURE_159: Ensure function app builtin logging is enabled
  'CKV_AZURE_159': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_160: Ensure that HTTP (port 80) access is restricted from the internet
  'CKV_AZURE_160': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_161: Ensures Spring Cloud API Portal is enabled on for HTTPS
  'CKV_AZURE_161': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_162: Ensures Spring Cloud API Portal Public Access Is Disabled
  'CKV_AZURE_162': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_163: Enable vulnerability scanning for container images.
  'CKV_AZURE_163': {cci: ['CCI-001645'], nist: ['RA-5(2)']},
  // CKV_AZURE_164: Ensures that ACR uses signed/trusted images
  'CKV_AZURE_164': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_AZURE_165: Ensure geo-replicated container registries to match multi-region container de...
  'CKV_AZURE_165': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AZURE_166: Ensure container image quarantine, scan, and mark images verified
  'CKV_AZURE_166': {cci: ['CCI-001644', 'CCI-002606'], nist: ['RA-5(1)', 'SI-2(1)']},
  // CKV_AZURE_167: Ensure a retention policy is set to cleanup untagged manifests.
  'CKV_AZURE_167': {cci: ['CCI-001904', 'CCI-000167'], nist: ['MP-6(1)', 'AU-11']},
  // CKV_AZURE_168: Ensure Azure Kubernetes Cluster (AKS) nodes should use a minimum number of 50...
  'CKV_AZURE_168': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_169: Ensure Azure Kubernetes Cluster (AKS) nodes use scale sets
  'CKV_AZURE_169': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_17: Ensure the web app has 'Client Certificates (Incoming client certificates)' set
  'CKV_AZURE_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_170: Ensure that AKS use the Paid Sku for its SLA
  'CKV_AZURE_170': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_171: Ensure AKS cluster upgrade channel is chosen
  'CKV_AZURE_171': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_172: Ensure autorotation of Secrets Store CSI Driver secrets for AKS clusters
  'CKV_AZURE_172': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_AZURE_173: Ensure API management uses at least TLS 1.2
  'CKV_AZURE_173': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_AZURE_174: Ensure API management public access is disabled
  'CKV_AZURE_174': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_175: Ensure Web PubSub uses a SKU with an SLA
  'CKV_AZURE_175': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_177: Ensure Windows VM enables automatic updates
  'CKV_AZURE_177': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_178: Ensure linux VM enables SSH with keys for secure communication
  'CKV_AZURE_178': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_AZURE_179: Ensure VM agent is installed
  'CKV_AZURE_179': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_18: Ensure that 'HTTP Version' is the latest if used to run the web app
  'CKV_AZURE_18': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_180: Ensure that data explorer uses Sku with an SLA
  'CKV_AZURE_180': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_182: Ensure that VNET has at least 2 connected DNS Endpoints
  'CKV_AZURE_182': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_183: Ensure that VNET uses local DNS addresses
  'CKV_AZURE_183': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_184: Ensure 'local_auth_enabled' is set to 'False'
  'CKV_AZURE_184': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_185: Ensure 'Public Access' is not Enabled for App configuration
  'CKV_AZURE_185': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_186: Ensure App configuration encryption block is set.
  'CKV_AZURE_186': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_187: Ensure App configuration purge protection is enabled
  'CKV_AZURE_187': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_188: Ensure App configuration Sku is standard
  'CKV_AZURE_188': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_AZURE_189: Ensure that Azure Key Vault disables public network access
  'CKV_AZURE_189': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_19: Ensure that standard pricing tier is selected
  'CKV_AZURE_19': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_190: Ensure that Storage blobs restrict public access
  'CKV_AZURE_190': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_192: Ensure that Azure Event Grid Topic local Authentication is disabled
  'CKV_AZURE_192': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_193: Ensure public network access is disabled for Azure Event Grid Topic
  'CKV_AZURE_193': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_195: Ensure that Azure Event Grid Domain local Authentication is disabled
  'CKV_AZURE_195': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_196: Ensure that SignalR uses a Paid Sku for its SLA
  'CKV_AZURE_196': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_197: Ensure the Azure CDN disables the HTTP endpoint
  'CKV_AZURE_197': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_198: Ensure the Azure CDN enables the HTTPS endpoint
  'CKV_AZURE_198': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_199: Ensure that Azure Service Bus uses double encryption
  'CKV_AZURE_199': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_2: Ensure Azure managed disk have encryption enabled
  'CKV_AZURE_2': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AZURE_20: Ensure that security contact 'Phone number' is set
  'CKV_AZURE_20': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_200: Ensure the Azure CDN endpoint is using the latest version of TLS encryption
  'CKV_AZURE_200': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_201: Ensure that Azure Service Bus uses a customer-managed key to encrypt data
  'CKV_AZURE_201': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AZURE_203: Ensure Azure Service Bus Local Authentication is disabled
  'CKV_AZURE_203': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_204: Ensure 'public network access enabled' is set to 'False' for Azure Service Bus
  'CKV_AZURE_204': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_205: Ensure Azure Service Bus is using the latest version of TLS encryption
  'CKV_AZURE_205': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_206: Ensure that Storage Accounts use replication
  'CKV_AZURE_206': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_208: Ensure that Azure Cognitive Search maintains SLA for index updates
  'CKV_AZURE_208': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_209: Ensure that Azure Cognitive Search maintains SLA for search index queries
  'CKV_AZURE_209': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_21: Ensure that 'Send email notification for high severity alerts' is set to 'On'
  'CKV_AZURE_21': {cci: ['CCI-002687', 'CCI-000229'], nist: ['SI-4(5)', 'IR-6(1)']},
  // CKV_AZURE_210: Ensure Azure Cognitive Search service allowed IPS does not give public Access
  'CKV_AZURE_210': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_211: Ensure App Service plan suitable for production use
  'CKV_AZURE_211': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_AZURE_212: Ensure App Service has a minimum number of instances for failover
  'CKV_AZURE_212': {cci: ['CCI-000555', 'CCI-000509'], nist: ['CP-10(2)', 'CP-9']},
  // CKV_AZURE_213: Ensure that App Service configures health check
  'CKV_AZURE_213': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_214: Ensure App Service is set to be always on
  'CKV_AZURE_214': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_215: Ensure API management backend uses https
  'CKV_AZURE_215': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_216: Ensure DenyIntelMode is set to Deny for Azure Firewalls
  'CKV_AZURE_216': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_217: Ensure Azure Application gateways listener that allow connection requests ove...
  'CKV_AZURE_217': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_218: Ensure Application Gateway defines secure protocols for in transit communication
  'CKV_AZURE_218': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_219: Ensure Firewall defines a firewall policy
  'CKV_AZURE_219': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_22: Ensure that 'Send email notification for high severity alerts' is set to 'On'
  'CKV_AZURE_22': {cci: ['CCI-002687', 'CCI-000229'], nist: ['SI-4(5)', 'IR-6(1)']},
  // CKV_AZURE_220: Ensure Firewall policy has IDPS mode as deny
  'CKV_AZURE_220': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_221: Ensure that Azure Function App public network access is disabled
  'CKV_AZURE_221': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_222: Ensure that Azure Web App public network access is disabled
  'CKV_AZURE_222': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_223: Ensure Event Hub Namespace uses at least TLS 1.2
  'CKV_AZURE_223': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_AZURE_224: Ensure that the Ledger feature is enabled on database that requires cryptogra...
  'CKV_AZURE_224': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_AZURE_225: Ensure the App Service Plan is zone redundant
  'CKV_AZURE_225': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_226: Ensure ephemeral disks are used for OS disks
  'CKV_AZURE_226': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_227: Ensure that the AKS cluster encrypt temp disks, caches, and data flows betwee...
  'CKV_AZURE_227': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AZURE_228: Ensure the Azure Event Hub Namespace is zone redundant
  'CKV_AZURE_228': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_229: Ensure the Azure SQL Database Namespace is zone redundant
  'CKV_AZURE_229': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_23: Ensure that 'Auditing' is set to 'Enabled' for SQL servers
  'CKV_AZURE_23': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_230: Standard Replication should be enabled
  'CKV_AZURE_230': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_231: Ensure App Service Environment is zone redundant
  'CKV_AZURE_231': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_232: Ensure that only critical system pods run on system nodes
  'CKV_AZURE_232': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_233: Ensure Azure Container Registry (ACR) is zone redundant
  'CKV_AZURE_233': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_234: Ensure that Azure Defender for cloud is set to On for Resource Manager
  'CKV_AZURE_234': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_235: Ensure that Azure container environment variables are configured with secure ...
  'CKV_AZURE_235': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_AZURE_236: Ensure that Cognitive Services accounts disable local authentication
  'CKV_AZURE_236': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_237: Ensure dedicated data endpoints are enabled.
  'CKV_AZURE_237': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_239: Ensure Azure Synapse Workspace administrator login password is not exposed
  'CKV_AZURE_239': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_AZURE_24: Ensure that 'Auditing' Retention is 'greater than 90 days' for SQL servers
  'CKV_AZURE_24': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_240: Ensure Azure Synapse Workspace is encrypted with a CMK
  'CKV_AZURE_240': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AZURE_241: Ensure Synapse SQL pools are encrypted
  'CKV_AZURE_241': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_242: Ensure isolated compute is enabled for Synapse Spark pools
  'CKV_AZURE_242': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_243: Ensure Azure Machine learning workspace is configured with private endpoint
  'CKV_AZURE_243': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AZURE_244: Avoid the use of local users for Azure Storage unless necessary
  'CKV_AZURE_244': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_245: Ensure that Azure Container group is deployed into virtual network
  'CKV_AZURE_245': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_246: Ensure Azure AKS cluster HTTP application routing is disabled
  'CKV_AZURE_246': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_247: Ensure that Azure Cognitive Services account hosted with OpenAI is configured...
  'CKV_AZURE_247': {cci: ['CCI-002476', 'CCI-001821'], nist: ['SC-28(1)', 'MP-4']},
  // CKV_AZURE_248: Ensure that if Azure Batch account public network access in case 'enabled' th...
  'CKV_AZURE_248': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_249: Ensure Azure GitHub Actions OIDC trust policy is configured securely
  'CKV_AZURE_249': {cci: ['CCI-001957', 'CCI-001954'], nist: ['IA-2(12)', 'IA-8(2)']},
  // CKV_AZURE_25: Azure SQL Server threat detection alerts are enabled for all threat types
  'CKV_AZURE_25': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_250: Ensure Storage Sync Service is not configured with overly permissive network ...
  'CKV_AZURE_250': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_251: Ensure Azure Virtual Machine disks are configured without public network access
  'CKV_AZURE_251': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_26: Ensure that 'Send Alerts To' is enabled for MSSQL servers
  'CKV_AZURE_26': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_27: Ensure that 'Email service and co-administrators' is 'Enabled' for MSSQL servers
  'CKV_AZURE_27': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_28: Ensure 'Enforce SSL connection' is set to 'ENABLED' for MySQL Database Server
  'CKV_AZURE_28': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AZURE_29: Ensure 'Enforce SSL connection' is set to 'ENABLED' for PostgreSQL Database S...
  'CKV_AZURE_29': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AZURE_3: Ensure that 'supportsHttpsTrafficOnly' is set to 'true'
  'CKV_AZURE_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_30: Ensure server parameter 'log_checkpoints' is set to 'ON' for PostgreSQL Datab...
  'CKV_AZURE_30': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_31: Ensure configuration 'log_connections' is set to 'ON' for PostgreSQL Database...
  'CKV_AZURE_31': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_32: Ensure server parameter 'connection_throttling' is set to 'ON' for PostgreSQL...
  'CKV_AZURE_32': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_33: Ensure Storage logging is enabled for Queue service for read, write and delet...
  'CKV_AZURE_33': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_34: Ensure that 'Public access level' is set to Private for blob containers
  'CKV_AZURE_34': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_35: Ensure default network access rule for Storage Accounts is set to deny
  'CKV_AZURE_35': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_36: Ensure 'Trusted Microsoft Services' is enabled for Storage Account access
  'CKV_AZURE_36': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_37: Ensure that Activity Log Retention is set 365 days or greater
  'CKV_AZURE_37': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_AZURE_38: Ensure audit profile captures all the activities
  'CKV_AZURE_38': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_39: Ensure that no custom subscription owner roles are created
  'CKV_AZURE_39': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_4: Ensure AKS logging to Azure Monitoring is Configured
  'CKV_AZURE_4': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_40: Ensure that the expiration date is set on all keys
  'CKV_AZURE_40': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_41: Ensure that the expiration date is set on all secrets
  'CKV_AZURE_41': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_42: Ensure the key vault is recoverable
  'CKV_AZURE_42': {cci: ['CCI-002452'], nist: ['SC-12(2)']},
  // CKV_AZURE_43: Ensure Storage Accounts adhere to the naming rules
  'CKV_AZURE_43': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_44: Ensure Storage Account is using the latest version of TLS encryption
  'CKV_AZURE_44': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_45: Ensure that no sensitive credentials are exposed in VM custom_data
  'CKV_AZURE_45': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_47: Ensure 'Enforce SSL connection' is set to 'ENABLED' for MariaDB servers
  'CKV_AZURE_47': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AZURE_48: Ensure 'public network access enabled' is set to 'False' for MariaDB servers
  'CKV_AZURE_48': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_49: Ensure Azure linux scale set does not use basic authentication(Use SSH Key In...
  'CKV_AZURE_49': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_AZURE_5: Ensure RBAC is enabled on AKS clusters
  'CKV_AZURE_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_50: Ensure Virtual Machine Extensions are not Installed
  'CKV_AZURE_50': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_52: Ensure MSSQL is using the latest version of TLS encryption
  'CKV_AZURE_52': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_53: Ensure 'public network access enabled' is set to 'False' for mySQL servers
  'CKV_AZURE_53': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_54: Ensure MySQL is using the latest version of TLS encryption
  'CKV_AZURE_54': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_55: Ensure that Azure Defender is set to On for Servers
  'CKV_AZURE_55': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_56: Ensure that function apps enables Authentication
  'CKV_AZURE_56': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_57: Ensure that CORS disallows every resource to access app services
  'CKV_AZURE_57': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_58: Ensure that Azure Synapse workspaces enables managed virtual networks
  'CKV_AZURE_58': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_59: Ensure that Storage accounts disallow public access
  'CKV_AZURE_59': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_6: Ensure AKS has an API Server Authorized IP Ranges enabled
  'CKV_AZURE_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_61: Ensure that Azure Defender is set to On for App Service
  'CKV_AZURE_61': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_62: Ensure function apps are not accessible from all regions
  'CKV_AZURE_62': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_63: Ensure that App service enables HTTP logging
  'CKV_AZURE_63': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_AZURE_64: Ensure that Azure File Sync disables public network access
  'CKV_AZURE_64': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_65: Ensure that App service enables detailed error messages
  'CKV_AZURE_65': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_66: Ensure that App service enables failed request tracing
  'CKV_AZURE_66': {cci: ['CCI-002684', 'CCI-000169'], nist: ['SI-4(2)', 'AU-12']},
  // CKV_AZURE_67: Ensure that 'HTTP Version' is the latest, if used to run the Function app
  'CKV_AZURE_67': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_68: Ensure that PostgreSQL server disables public network access
  'CKV_AZURE_68': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_69: Ensure that Azure Defender is set to On for Azure SQL database servers
  'CKV_AZURE_69': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_7: Ensure AKS cluster has Network Policy configured
  'CKV_AZURE_7': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_AZURE_70: Ensure that Function apps is only accessible over HTTPS
  'CKV_AZURE_70': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_72: Ensure that remote debugging is not enabled for app services
  'CKV_AZURE_72': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_73: Ensure that Automation account variables are encrypted
  'CKV_AZURE_73': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_74: Ensure that Azure Data Explorer (Kusto) uses disk encryption
  'CKV_AZURE_74': {cci: ['CCI-002476'], nist: ['SC-28(1)']},
  // CKV_AZURE_75: Ensure that Azure Data Explorer uses double encryption
  'CKV_AZURE_75': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_76: Ensure that Azure Batch account uses key vault to encrypt data
  'CKV_AZURE_76': {cci: ['CCI-002452'], nist: ['SC-12(2)']},
  // CKV_AZURE_77: Ensure that UDP Services are restricted from the Internet
  'CKV_AZURE_77': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_78: Ensure FTP deployments are disabled
  'CKV_AZURE_78': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_79: Ensure that Azure Defender is set to On for SQL servers on machines
  'CKV_AZURE_79': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_8: Ensure Kubernetes Dashboard is disabled
  'CKV_AZURE_8': {cci: ['CCI-001521'], nist: ['CM-7(2)']},
  // CKV_AZURE_80: Ensure that 'Net Framework' version is the latest, if used as a part of the w...
  'CKV_AZURE_80': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_AZURE_81: Ensure that 'PHP version' is the latest, if used to run the web app
  'CKV_AZURE_81': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_82: Ensure that 'Python version' is the latest, if used to run the web app
  'CKV_AZURE_82': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_83: Ensure that 'Java version' is the latest, if used to run the web app
  'CKV_AZURE_83': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_84: Ensure that Azure Defender is set to On for Storage
  'CKV_AZURE_84': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_85: Ensure that Azure Defender is set to On for Kubernetes
  'CKV_AZURE_85': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_86: Ensure that Azure Defender is set to On for Container Registries
  'CKV_AZURE_86': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_87: Ensure that Azure Defender is set to On for Key Vault
  'CKV_AZURE_87': {cci: ['CCI-002686', 'CCI-001645'], nist: ['SI-4(4)', 'RA-5(2)']},
  // CKV_AZURE_88: Ensure that app services use Azure Files
  'CKV_AZURE_88': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_89: Ensure that Azure Cache for Redis disables public network access
  'CKV_AZURE_89': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_AZURE_9: Ensure that RDP access is restricted from the internet
  'CKV_AZURE_9': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_AZURE_91: Ensure that only SSL are enabled for Cache for Redis
  'CKV_AZURE_91': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_AZURE_92: Ensure that Virtual Machines use managed disks
  'CKV_AZURE_92': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_93: Ensure that managed disks use a specific set of disk encryption sets for the ...
  'CKV_AZURE_93': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_AZURE_94: Ensure that My SQL server enables geo-redundant backups
  'CKV_AZURE_94': {cci: ['CCI-000504', 'CCI-000512'], nist: ['CP-6(1)', 'CP-9(3)']},
  // CKV_AZURE_95: Ensure that automatic OS image patching is enabled for Virtual Machine Scale ...
  'CKV_AZURE_95': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_96: Ensure that MySQL server enables infrastructure encryption
  'CKV_AZURE_96': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_97: Ensure that Virtual machine scale sets have encryption at host enabled
  'CKV_AZURE_97': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_AZURE_98: Ensure that Azure Container group is deployed into virtual network
  'CKV_AZURE_98': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_AZURE_99: Ensure Cosmos DB accounts have restricted access
  'CKV_AZURE_99': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_BCW_1: Ensure no hard coded API token exist in the provider
  'CKV_BCW_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_BITBUCKETPIPELINES_1: Ensure the pipeline image uses a non latest version tag
  'CKV_BITBUCKETPIPELINES_1': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_BITBUCKET_1: Merge requests should require at least 2 approvals
  'CKV_BITBUCKET_1': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_CIRCLECIPIPELINES_1: Ensure the pipeline image uses a non latest version tag
  'CKV_CIRCLECIPIPELINES_1': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_CIRCLECIPIPELINES_2: Ensure the pipeline image version is referenced via hash not arbitrary tag.
  'CKV_CIRCLECIPIPELINES_2': {cci: ['CCI-001648', 'CCI-002700'], nist: ['RA-5(5)', 'SI-7(1)']},
  // CKV_CIRCLECIPIPELINES_3: Ensure mutable development orbs are not used.
  'CKV_CIRCLECIPIPELINES_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_CIRCLECIPIPELINES_4: Ensure unversioned volatile orbs are not used.
  'CKV_CIRCLECIPIPELINES_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_CIRCLECIPIPELINES_5: Suspicious use of netcat with IP address
  'CKV_CIRCLECIPIPELINES_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_CIRCLECIPIPELINES_6: Ensure run commands are not vulnerable to shell injection
  'CKV_CIRCLECIPIPELINES_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_CIRCLECIPIPELINES_7: Suspicious use of curl in run task
  'CKV_CIRCLECIPIPELINES_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_CIRCLECIPIPELINES_8: Detecting image usages in circleci pipelines
  'CKV_CIRCLECIPIPELINES_8': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DIO_1: Ensure the Spaces bucket has versioning enabled
  'CKV_DIO_1': {cci: ['CCI-000510', 'CCI-000164'], nist: ['CP-9(1)', 'AU-9(2)']},
  // CKV_DIO_2: Ensure the droplet specifies an SSH key
  'CKV_DIO_2': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_DIO_3: Ensure the Spaces bucket is private
  'CKV_DIO_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DIO_4: Ensure the firewall ingress is not wide open
  'CKV_DIO_4': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_DOCKER_1: Ensure port 22 is not exposed
  'CKV_DOCKER_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_10: Ensure that WORKDIR values are absolute paths
  'CKV_DOCKER_10': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_11: Ensure From Alias are unique for multistage builds.
  'CKV_DOCKER_11': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_2: Ensure that HEALTHCHECK instructions have been added to container images
  'CKV_DOCKER_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_3: Ensure that a user for the container has been created
  'CKV_DOCKER_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_4: Ensure that COPY is used instead of ADD in Dockerfiles
  'CKV_DOCKER_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_5: Ensure update instructions are not use alone in the Dockerfile
  'CKV_DOCKER_5': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_DOCKER_6: Ensure that LABEL maintainer is used instead of MAINTAINER (deprecated)
  'CKV_DOCKER_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_7: Ensure the base image uses a non latest version tag
  'CKV_DOCKER_7': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_DOCKER_8: Ensure the last USER is not root
  'CKV_DOCKER_8': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_DOCKER_9: Ensure that APT isn't used
  'CKV_DOCKER_9': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_1: Ensure Stackdriver Logging is set to Enabled on Kubernetes Engine Clusters
  'CKV_GCP_1': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_10: Ensure 'Automatic node upgrade' is enabled for Kubernetes Clusters
  'CKV_GCP_10': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_GCP_100: Ensure that BigQuery Tables are not anonymously or publicly accessible
  'CKV_GCP_100': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_101: Ensure that Artifact Registry repositories are not anonymously or publicly ac...
  'CKV_GCP_101': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_102: Ensure that GCP Cloud Run services are not anonymously or publicly accessible
  'CKV_GCP_102': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_103: Ensure Dataproc Clusters do not have public IPs
  'CKV_GCP_103': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_104: Ensure Datafusion has stack driver logging enabled
  'CKV_GCP_104': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_105: Ensure Datafusion has stack driver monitoring enabled
  'CKV_GCP_105': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_106: Ensure Google compute firewall ingress does not allow unrestricted http port ...
  'CKV_GCP_106': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_GCP_107: Cloud functions should not be public
  'CKV_GCP_107': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_GCP_108: Ensure hostnames are logged for GCP PostgreSQL databases
  'CKV_GCP_108': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_109: Ensure the GCP PostgreSQL database log levels are set to ERROR or lower
  'CKV_GCP_109': {cci: ['CCI-000135', 'CCI-000169'], nist: ['AU-3(1)', 'AU-12']},
  // CKV_GCP_11: Ensure that Cloud SQL database Instances are not open to the world
  'CKV_GCP_11': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_110: Ensure pgAudit is enabled for your GCP PostgreSQL database
  'CKV_GCP_110': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_111: Ensure GCP PostgreSQL logs SQL statements
  'CKV_GCP_111': {cci: ['CCI-000135', 'CCI-000169'], nist: ['AU-3(1)', 'AU-12']},
  // CKV_GCP_112: Ensure KMS policy should not allow public access
  'CKV_GCP_112': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_GCP_113: Ensure IAM policy should not define public access
  'CKV_GCP_113': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_114: Ensure public access prevention is enforced on Cloud Storage bucket
  'CKV_GCP_114': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_115: Ensure basic roles are not used at organization level.
  'CKV_GCP_115': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_116: Ensure basic roles are not used at folder level.
  'CKV_GCP_116': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_117: Ensure basic roles are not used at project level.
  'CKV_GCP_117': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_119: Ensure Spanner Database has deletion protection enabled
  'CKV_GCP_119': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_12: Ensure Network Policy is enabled on Kubernetes Engine Clusters
  'CKV_GCP_12': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_120: Ensure Spanner Database has drop protection enabled
  'CKV_GCP_120': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_121: Ensure BigQuery tables have deletion protection enabled
  'CKV_GCP_121': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_122: Ensure Big Table Instances have deletion protection enabled
  'CKV_GCP_122': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_123: GKE Don't Use NodePools in the Cluster configuration
  'CKV_GCP_123': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_124: Ensure GCP Cloud Function is not configured with overly permissive Ingress se...
  'CKV_GCP_124': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_125: Ensure GCP GitHub Actions OIDC trust policy is configured securely
  'CKV_GCP_125': {cci: ['CCI-001957', 'CCI-001954'], nist: ['IA-2(12)', 'IA-8(2)']},
  // CKV_GCP_126: Ensure Vertex AI Notebook instances are launched with Shielded VM enabled
  'CKV_GCP_126': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_127: Ensure Integrity Monitoring for Shielded Vertex AI Notebook Instances is Enabled
  'CKV_GCP_127': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_13: Ensure client certificate authentication to Kubernetes Engine Clusters is dis...
  'CKV_GCP_13': {cci: ['CCI-002420', 'CCI-002448'], nist: ['SC-8(1)', 'SC-17']},
  // CKV_GCP_14: Ensure all Cloud SQL database instance have backup configuration enabled
  'CKV_GCP_14': {cci: ['CCI-000510'], nist: ['CP-9(1)']},
  // CKV_GCP_15: Ensure that BigQuery datasets are not anonymously or publicly accessible
  'CKV_GCP_15': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_16: Ensure that DNSSEC is enabled for Cloud DNS
  'CKV_GCP_16': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_17: Ensure that RSASHA1 is not used for the zone-signing and key-signing keys in ...
  'CKV_GCP_17': {cci: ['CCI-001099'], nist: ['SC-7(4)', 'SC-20']},
  // CKV_GCP_18: Ensure GKE Control Plane is not public
  'CKV_GCP_18': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_GCP_2: Ensure Google compute firewall ingress does not allow unrestricted ssh access
  'CKV_GCP_2': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_GCP_20: Ensure master authorized networks is set to enabled in GKE clusters
  'CKV_GCP_20': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_21: Ensure Kubernetes Clusters are configured with Labels
  'CKV_GCP_21': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_22: Ensure Container-Optimized OS (cos) is used for Kubernetes Engine Clusters No...
  'CKV_GCP_22': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_23: Ensure Kubernetes Cluster is created with Alias IP ranges enabled
  'CKV_GCP_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_24: Ensure PodSecurityPolicy controller is enabled on the Kubernetes Engine Clusters
  'CKV_GCP_24': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_25: Ensure Kubernetes Cluster is created with Private cluster enabled
  'CKV_GCP_25': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_26: Ensure that VPC Flow Logs is enabled for every subnet in a VPC Network
  'CKV_GCP_26': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_27: Ensure that the default network does not exist in a project
  'CKV_GCP_27': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_28: Ensure that Cloud Storage bucket is not anonymously or publicly accessible
  'CKV_GCP_28': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_29: Ensure that Cloud Storage buckets have uniform bucket-level access enabled
  'CKV_GCP_29': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_3: Ensure Google compute firewall ingress does not allow unrestricted rdp access
  'CKV_GCP_3': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_GCP_30: Ensure that instances are not configured to use the default service account
  'CKV_GCP_30': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_GCP_31: Ensure that instances are not configured to use the default service account w...
  'CKV_GCP_31': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_GCP_32: Ensure 'Block Project-wide SSH keys' is enabled for VM instances
  'CKV_GCP_32': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_GCP_33: Ensure oslogin is enabled for a Project
  'CKV_GCP_33': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_34: Ensure that no instance in the project overrides the project setting for enab...
  'CKV_GCP_34': {cci: ['CCI-000385'], nist: ['CM-8(1)']},
  // CKV_GCP_35: Ensure 'Enable connecting to serial ports' is not enabled for VM Instance
  'CKV_GCP_35': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_36: Ensure that IP forwarding is not enabled on Instances
  'CKV_GCP_36': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_37: Ensure VM disks for critical VMs are encrypted with Customer Supplied Encrypt...
  'CKV_GCP_37': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_38: Ensure VM disks for critical VMs are encrypted with Customer Supplied Encrypt...
  'CKV_GCP_38': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_39: Ensure Compute instances are launched with Shielded VM enabled
  'CKV_GCP_39': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_4: Ensure no HTTPS or SSL proxy load balancers permit SSL policies with weak cip...
  'CKV_GCP_4': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_GCP_40: Ensure that Compute instances do not have public IP addresses
  'CKV_GCP_40': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_41: Ensure that IAM users are not assigned the Service Account User or Service Ac...
  'CKV_GCP_41': {cci: ['CCI-000016', 'CCI-000213'], nist: ['AC-2(1)', 'AC-3']},
  // CKV_GCP_42: Ensure that Service Account has no Admin privileges
  'CKV_GCP_42': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_43: Ensure KMS encryption keys are rotated within a period of 90 days
  'CKV_GCP_43': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_GCP_44: Ensure no roles that enable to impersonate and manage all service accounts ar...
  'CKV_GCP_44': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_45: Ensure no roles that enable to impersonate and manage all service accounts ar...
  'CKV_GCP_45': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_46: Ensure Default Service account is not used at a project level
  'CKV_GCP_46': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_GCP_47: Ensure default service account is not used at an organization level
  'CKV_GCP_47': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_GCP_48: Ensure Default Service account is not used at a folder level
  'CKV_GCP_48': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_GCP_49: Ensure roles do not impersonate or manage Service Accounts used at project level
  'CKV_GCP_49': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_50: Ensure MySQL database 'local_infile' flag is set to 'off'
  'CKV_GCP_50': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_51: Ensure PostgreSQL database 'log_checkpoints' flag is set to 'on'
  'CKV_GCP_51': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_52: Ensure PostgreSQL database 'log_connections' flag is set to 'on'
  'CKV_GCP_52': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_53: Ensure PostgreSQL database 'log_disconnections' flag is set to 'on'
  'CKV_GCP_53': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_54: Ensure PostgreSQL database 'log_lock_waits' flag is set to 'on'
  'CKV_GCP_54': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_55: Ensure PostgreSQL database 'log_min_messages' flag is set to a valid value
  'CKV_GCP_55': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_56: Ensure PostgreSQL database 'log_temp_files flag is set to '0'
  'CKV_GCP_56': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_57: Ensure PostgreSQL database 'log_min_duration_statement' flag is set to '-1'
  'CKV_GCP_57': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_58: Ensure SQL database 'cross db ownership chaining' flag is set to 'off'
  'CKV_GCP_58': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_59: Ensure SQL database 'contained database authentication' flag is set to 'off'
  'CKV_GCP_59': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_6: Ensure all Cloud SQL database instance requires all incoming connections to u...
  'CKV_GCP_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_60: Ensure Cloud SQL database does not have public IP
  'CKV_GCP_60': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_61: Enable VPC Flow Logs and Intranode Visibility
  'CKV_GCP_61': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_62: Bucket should log access
  'CKV_GCP_62': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_63: Bucket should not log to itself
  'CKV_GCP_63': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_64: Ensure clusters are created with Private Nodes
  'CKV_GCP_64': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_65: Manage Kubernetes RBAC users with Google Groups for GKE
  'CKV_GCP_65': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_66: Ensure use of Binary Authorization
  'CKV_GCP_66': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_68: Ensure Secure Boot for Shielded GKE Nodes is Enabled
  'CKV_GCP_68': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_69: Ensure the GKE Metadata Server is Enabled
  'CKV_GCP_69': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_7: Ensure Legacy Authorization is set to Disabled on Kubernetes Engine Clusters
  'CKV_GCP_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_70: Ensure the GKE Release Channel is set
  'CKV_GCP_70': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_71: Ensure Shielded GKE Nodes are Enabled
  'CKV_GCP_71': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_72: Ensure Integrity Monitoring for Shielded GKE Nodes is Enabled
  'CKV_GCP_72': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_73: Ensure Cloud Armor prevents message lookup in Log4j2. See CVE-2021-44228 aka ...
  'CKV_GCP_73': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_74: Ensure that private_ip_google_access is enabled for Subnet
  'CKV_GCP_74': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_75: Ensure Google compute firewall ingress does not allow unrestricted FTP access
  'CKV_GCP_75': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_GCP_76: Ensure that Private google access is enabled for IPV6
  'CKV_GCP_76': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_GCP_77: Ensure Google compute firewall ingress does not allow on ftp port
  'CKV_GCP_77': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_GCP_78: Ensure Cloud storage has versioning enabled
  'CKV_GCP_78': {cci: ['CCI-000510', 'CCI-000164'], nist: ['CP-9(1)', 'AU-9(2)']},
  // CKV_GCP_79: Ensure SQL database is using latest Major version
  'CKV_GCP_79': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_8: Ensure Stackdriver Monitoring is set to Enabled on Kubernetes Engine Clusters
  'CKV_GCP_8': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_GCP_80: Ensure Big Query Tables are encrypted with Customer Supplied Encryption Keys ...
  'CKV_GCP_80': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_81: Ensure Big Query Datasets are encrypted with Customer Supplied Encryption Key...
  'CKV_GCP_81': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_82: Ensure KMS keys are protected from deletion
  'CKV_GCP_82': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_GCP_83: Ensure PubSub Topics are encrypted with Customer Supplied Encryption Keys (CSEK)
  'CKV_GCP_83': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_84: Ensure Artifact Registry Repositories are encrypted with Customer Supplied En...
  'CKV_GCP_84': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_85: Ensure Big Table Instances are encrypted with Customer Supplied Encryption Ke...
  'CKV_GCP_85': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_86: Ensure Cloud build workers are private
  'CKV_GCP_86': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_87: Ensure Data fusion instances are private
  'CKV_GCP_87': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_88: Ensure Google compute firewall ingress does not allow unrestricted mysql access
  'CKV_GCP_88': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_GCP_89: Ensure Vertex AI instances are private
  'CKV_GCP_89': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_9: Ensure 'Automatic node repair' is enabled for Kubernetes Clusters
  'CKV_GCP_9': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_90: Ensure data flow jobs are encrypted with Customer Supplied Encryption Keys (C...
  'CKV_GCP_90': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_91: Ensure Dataproc cluster is encrypted with Customer Supplied Encryption Keys (...
  'CKV_GCP_91': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_92: Ensure Vertex AI datasets uses a CMK (Customer Managed Key)
  'CKV_GCP_92': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_GCP_93: Ensure Spanner Database is encrypted with Customer Supplied Encryption Keys (...
  'CKV_GCP_93': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_94: Ensure Dataflow jobs are private
  'CKV_GCP_94': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_95: Ensure Memorystore for Redis has AUTH enabled
  'CKV_GCP_95': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GCP_96: Ensure Vertex AI Metadata Store uses a CMK (Customer Managed Key)
  'CKV_GCP_96': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_GCP_97: Ensure Memorystore for Redis uses intransit encryption
  'CKV_GCP_97': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GCP_98: Ensure that Dataproc clusters are not anonymously or publicly accessible
  'CKV_GCP_98': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GCP_99: Ensure that Pub/Sub Topics are not anonymously or publicly accessible
  'CKV_GCP_99': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_GHA_1: Ensure ACTIONS_ALLOW_UNSECURE_COMMANDS isn't true on environment variables
  'CKV_GHA_1': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_GHA_2: Ensure run commands are not vulnerable to shell injection
  'CKV_GHA_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GHA_3: Suspicious use of curl with secrets
  'CKV_GHA_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GHA_4: Suspicious use of netcat with IP address
  'CKV_GHA_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GHA_5: Found artifact build without evidence of cosign sign execution in pipeline
  'CKV_GHA_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GHA_6: Found artifact build without evidence of cosign sbom attestation in pipeline
  'CKV_GHA_6': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_GHA_7: The build output cannot be affected by user parameters other than the build e...
  'CKV_GHA_7': {cci: ['CCI-002002', 'CCI-002700'], nist: ['SA-11(1)', 'SI-7(1)']},
  // CKV_GITHUB_1: Ensure GitHub organization security settings require 2FA
  'CKV_GITHUB_1': {cci: ['CCI-000765', 'CCI-000766'], nist: ['IA-2(1)', 'IA-2(2)']},
  // CKV_GITHUB_10: Ensure branch protection rules are enforced on administrators
  'CKV_GITHUB_10': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_11: Ensure GitHub branch protection dismisses stale review on new commit
  'CKV_GITHUB_11': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GITHUB_12: Ensure GitHub branch protection restricts who can dismiss PR reviews
  'CKV_GITHUB_12': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GITHUB_13: Ensure GitHub branch protection requires CODEOWNER reviews
  'CKV_GITHUB_13': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GITHUB_14: Ensure all checks have passed before the merge of new code
  'CKV_GITHUB_14': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_15: Ensure inactive branches are reviewed and removed periodically
  'CKV_GITHUB_15': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GITHUB_16: Ensure GitHub branch protection requires conversation resolution
  'CKV_GITHUB_16': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_17: Ensure GitHub branch protection requires push restrictions
  'CKV_GITHUB_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_18: Ensure GitHub branch protection rules does not allow deletions
  'CKV_GITHUB_18': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_19: Ensure any change to code receives approval of two strongly authenticated users
  'CKV_GITHUB_19': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GITHUB_2: Ensure GitHub organization security settings require SSO
  'CKV_GITHUB_2': {cci: ['CCI-001957', 'CCI-001954'], nist: ['IA-2(12)', 'IA-8(2)']},
  // CKV_GITHUB_20: Ensure open git branches are up to date before they can be merged into codebase
  'CKV_GITHUB_20': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_21: Ensure public repository creation is limited to specific members
  'CKV_GITHUB_21': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_GITHUB_22: Ensure private repository creation is limited to specific members
  'CKV_GITHUB_22': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_23: Ensure internal repository creation is limited to specific members
  'CKV_GITHUB_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_26: Ensure minimum admins are set for the organization
  'CKV_GITHUB_26': {cci: ['CCI-000019', 'CCI-000230'], nist: ['AC-2(4)', 'AC-6(5)']},
  // CKV_GITHUB_27: Ensure strict base permissions are set for repositories
  'CKV_GITHUB_27': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_28: Ensure an organization's identity is confirmed with a Verified badge Passed
  'CKV_GITHUB_28': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_3: Ensure GitHub organization security settings has IP allow list enabled
  'CKV_GITHUB_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_4: Ensure GitHub branch protection rules requires signed commits
  'CKV_GITHUB_4': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_GITHUB_5: Ensure GitHub branch protection rules does not allow force pushes
  'CKV_GITHUB_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_6: Ensure GitHub organization webhooks are using HTTPS
  'CKV_GITHUB_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_7: Ensure GitHub repository webhooks are using HTTPS
  'CKV_GITHUB_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_8: Ensure GitHub branch protection rules requires linear history
  'CKV_GITHUB_8': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITHUB_9: Ensure 2 admins are set for each repository
  'CKV_GITHUB_9': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITLABCI_1: Suspicious use of curl with CI environment variables in script
  'CKV_GITLABCI_1': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_GITLABCI_2: Avoid creating rules that generate double pipelines
  'CKV_GITLABCI_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITLABCI_3: Detecting image usages in gitlab workflows
  'CKV_GITLABCI_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GITLAB_1: Merge requests should require at least 2 approvals
  'CKV_GITLAB_1': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GIT_1: Ensure GitHub repository is Private
  'CKV_GIT_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GIT_2: Ensure GitHub repository webhooks are using HTTPS
  'CKV_GIT_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GIT_3: Ensure GitHub repository has vulnerability alerts enabled
  'CKV_GIT_3': {cci: ['CCI-001645'], nist: ['RA-5(2)']},
  // CKV_GIT_4: Ensure GitHub Actions secrets are encrypted
  'CKV_GIT_4': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_GIT_5: GitHub pull requests should require at least 2 approvals
  'CKV_GIT_5': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GIT_6: Ensure GitHub branch protection rules requires signed commits
  'CKV_GIT_6': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_GLB_1: Ensure at least two approving reviews are required to merge a GitLab MR
  'CKV_GLB_1': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_GLB_2: Ensure GitLab branch protection rules does not allow force pushes
  'CKV_GLB_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GLB_3: Ensure GitLab prevent secrets is enabled
  'CKV_GLB_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_GLB_4: Ensure GitLab commits are signed
  'CKV_GLB_4': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_K8S_1: Do not admit containers wishing to share the host process ID namespace
  'CKV_K8S_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_10: CPU requests should be set
  'CKV_K8S_10': {cci: ['CCI-002385', 'CCI-001515'], nist: ['SC-5(1)', 'CM-6(1)']},
  // CKV_K8S_100: Ensure that the --tls-cert-file and --tls-private-key-file arguments are set ...
  'CKV_K8S_100': {cci: ['CCI-002420', 'CCI-002451'], nist: ['SC-8(1)', 'SC-12(1)']},
  // CKV_K8S_102: Ensure that the --etcd-cafile argument is set as appropriate
  'CKV_K8S_102': {cci: ['CCI-002420', 'CCI-002451'], nist: ['SC-8(1)', 'SC-12(1)']},
  // CKV_K8S_104: Ensure that encryption providers are appropriately configured
  'CKV_K8S_104': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_K8S_105: Ensure that the API Server only makes use of Strong Cryptographic Ciphers
  'CKV_K8S_105': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_K8S_106: Ensure that the --terminated-pod-gc-threshold argument is set as appropriate
  'CKV_K8S_106': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_107: Ensure that the --profiling argument is set to false
  'CKV_K8S_107': {cci: ['CCI-000382'], nist: ['CM-7(1)']},
  // CKV_K8S_108: Ensure that the --use-service-account-credentials argument is set to true
  'CKV_K8S_108': {cci: ['CCI-000230'], nist: ['AC-6(5)']},
  // CKV_K8S_11: CPU limits should be set
  'CKV_K8S_11': {cci: ['CCI-002385', 'CCI-001515'], nist: ['SC-5(1)', 'CM-6(1)']},
  // CKV_K8S_110: Ensure that the --service-account-private-key-file argument is set as appropr...
  'CKV_K8S_110': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_111: Ensure that the --root-ca-file argument is set as appropriate
  'CKV_K8S_111': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_112: Ensure that the RotateKubeletServerCertificate argument is set to true
  'CKV_K8S_112': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_113: Ensure that the --bind-address argument is set to 127.0.0.1
  'CKV_K8S_113': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_114: Ensure that the --profiling argument is set to false
  'CKV_K8S_114': {cci: ['CCI-000382'], nist: ['CM-7(1)']},
  // CKV_K8S_115: Ensure that the --bind-address argument is set to 127.0.0.1
  'CKV_K8S_115': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_116: Ensure that the --cert-file and --key-file arguments are set as appropriate
  'CKV_K8S_116': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_117: Ensure that the --client-cert-auth argument is set to true
  'CKV_K8S_117': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_118: Ensure that the --auto-tls argument is not set to true
  'CKV_K8S_118': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_119: Ensure that the --peer-cert-file and --peer-key-file arguments are set as app...
  'CKV_K8S_119': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_K8S_12: Memory requests should be set
  'CKV_K8S_12': {cci: ['CCI-002385', 'CCI-001515'], nist: ['SC-5(1)', 'CM-6(1)']},
  // CKV_K8S_121: Ensure that the --peer-client-cert-auth argument is set to true
  'CKV_K8S_121': {cci: ['CCI-001501', 'CCI-001510'], nist: ['CM-3(2)', 'CM-5(1)']},
  // CKV_K8S_13: Memory limits should be set
  'CKV_K8S_13': {cci: ['CCI-002385', 'CCI-001515'], nist: ['SC-5(1)', 'CM-6(1)']},
  // CKV_K8S_138: Ensure that the --anonymous-auth argument is set to false
  'CKV_K8S_138': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_139: Ensure that the --authorization-mode argument is not set to AlwaysAllow
  'CKV_K8S_139': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_14: Image Tag should be fixed - not latest or blank
  'CKV_K8S_14': {cci: ['CCI-001648', 'CCI-002700'], nist: ['RA-5(5)', 'SI-7(1)']},
  // CKV_K8S_140: Ensure that the --client-ca-file argument is set as appropriate
  'CKV_K8S_140': {cci: ['CCI-002420', 'CCI-002451'], nist: ['SC-8(1)', 'SC-12(1)']},
  // CKV_K8S_141: Ensure that the --read-only-port argument is set to 0
  'CKV_K8S_141': {cci: ['CCI-001515', 'CCI-000166'], nist: ['CM-6(1)', 'AU-9(4)']},
  // CKV_K8S_144: Ensure that the --protect-kernel-defaults argument is set to true
  'CKV_K8S_144': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_145: Ensure that the --make-iptables-util-chains argument is set to true
  'CKV_K8S_145': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_146: Ensure that the --hostname-override argument is not set
  'CKV_K8S_146': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_147: Ensure that the --event-qps argument is set to 0 or a level which ensures app...
  'CKV_K8S_147': {cci: ['CCI-002687', 'CCI-000229'], nist: ['SI-4(5)', 'IR-6(1)']},
  // CKV_K8S_148: Ensure that the --tls-cert-file and --tls-private-key-file arguments are set ...
  'CKV_K8S_148': {cci: ['CCI-002420', 'CCI-002451'], nist: ['SC-8(1)', 'SC-12(1)']},
  // CKV_K8S_149: Ensure that the --rotate-certificates argument is not set to false
  'CKV_K8S_149': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_15: Image Pull Policy should be Always
  'CKV_K8S_15': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_151: Ensure that the Kubelet only makes use of Strong Cryptographic Ciphers
  'CKV_K8S_151': {cci: ['CCI-002420', 'CCI-002450'], nist: ['SC-8(1)', 'SC-13']},
  // CKV_K8S_152: Prevent NGINX Ingress annotation snippets which contain LUA code execution. S...
  'CKV_K8S_152': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_153: Prevent All NGINX Ingress annotation snippets. See CVE-2021-25742
  'CKV_K8S_153': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_154: Prevent NGINX Ingress annotation snippets which contain alias statements See ...
  'CKV_K8S_154': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_155: Minimize ClusterRoles that grant control over validating or mutating admissio...
  'CKV_K8S_155': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_K8S_156: Minimize ClusterRoles that grant permissions to approve CertificateSigningReq...
  'CKV_K8S_156': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_K8S_157: Minimize Roles and ClusterRoles that grant permissions to bind RoleBindings o...
  'CKV_K8S_157': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_K8S_158: Minimize Roles and ClusterRoles that grant permissions to escalate Roles or C...
  'CKV_K8S_158': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_K8S_159: Limit the use of git-sync to prevent code injection
  'CKV_K8S_159': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_16: Container should not be privileged
  'CKV_K8S_16': {cci: ['CCI-000226', 'CCI-001521'], nist: ['AC-6(1)', 'CM-7(2)']},
  // CKV_K8S_17: Containers should not share the host process ID namespace
  'CKV_K8S_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_18: Containers should not share the host IPC namespace
  'CKV_K8S_18': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_19: Containers should not share the host network namespace
  'CKV_K8S_19': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_2: Do not admit privileged containers
  'CKV_K8S_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_20: Containers should not run with allowPrivilegeEscalation
  'CKV_K8S_20': {cci: ['CCI-000226', 'CCI-000235'], nist: ['AC-6(1)', 'AC-6(10)']},
  // CKV_K8S_21: The default namespace should not be used
  'CKV_K8S_21': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_K8S_22: Use read-only filesystem for containers where possible
  'CKV_K8S_22': {cci: ['CCI-001515', 'CCI-000166'], nist: ['CM-6(1)', 'AU-9(4)']},
  // CKV_K8S_23: Minimize the admission of root containers
  'CKV_K8S_23': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_24: Do not allow containers with added capability
  'CKV_K8S_24': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_25: Minimize the admission of containers with added capability
  'CKV_K8S_25': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_26: Do not specify hostPort unless absolutely necessary
  'CKV_K8S_26': {cci: ['CCI-001098', 'CCI-001521'], nist: ['SC-7(3)', 'CM-7(2)']},
  // CKV_K8S_27: Do not expose the docker daemon socket to containers
  'CKV_K8S_27': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_28: Minimize the admission of containers with the NET_RAW capability
  'CKV_K8S_28': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_29: Apply security context to your pods and containers
  'CKV_K8S_29': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_3: Do not admit containers wishing to share the host IPC namespace
  'CKV_K8S_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_30: Apply security context to your containers
  'CKV_K8S_30': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_31: Ensure that the seccomp profile is set to docker/default or runtime/default
  'CKV_K8S_31': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_32: Ensure default seccomp profile set to docker/default or runtime/default
  'CKV_K8S_32': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_33: Ensure the Kubernetes dashboard is not deployed
  'CKV_K8S_33': {cci: ['CCI-001521'], nist: ['CM-7(2)']},
  // CKV_K8S_34: Ensure that Tiller (Helm v2) is not deployed
  'CKV_K8S_34': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_35: Prefer using secrets as files over secrets as environment variables
  'CKV_K8S_35': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_K8S_36: Minimize the admission of containers with capabilities assigned
  'CKV_K8S_36': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_37: Minimize the admission of containers with capabilities assigned
  'CKV_K8S_37': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_38: Ensure that Service Account Tokens are only mounted where necessary
  'CKV_K8S_38': {cci: ['CCI-000230', 'CCI-001941'], nist: ['AC-6(5)', 'IA-2(6)']},
  // CKV_K8S_39: Do not use the CAP_SYS_ADMIN linux capability
  'CKV_K8S_39': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_4: Do not admit containers wishing to share the host network namespace
  'CKV_K8S_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_40: Containers should run as a high UID to avoid host conflict
  'CKV_K8S_40': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_41: Ensure that default service accounts are not actively used
  'CKV_K8S_41': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_K8S_42: Ensure that default service accounts are not actively used
  'CKV_K8S_42': {cci: ['CCI-000230', 'CCI-001515'], nist: ['AC-6(5)', 'CM-6(1)']},
  // CKV_K8S_43: Image should use digest
  'CKV_K8S_43': {cci: ['CCI-001648', 'CCI-002700'], nist: ['RA-5(5)', 'SI-7(1)']},
  // CKV_K8S_44: Ensure that the Tiller Service (Helm v2) is deleted
  'CKV_K8S_44': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_45: Ensure the Tiller Deployment (Helm V2) is not accessible from within the cluster
  'CKV_K8S_45': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_49: Minimize wildcard use in Roles and ClusterRoles
  'CKV_K8S_49': {cci: ['CCI-000226', 'CCI-000230'], nist: ['AC-6(1)', 'AC-6(5)']},
  // CKV_K8S_5: Containers should not run with allowPrivilegeEscalation
  'CKV_K8S_5': {cci: ['CCI-000226', 'CCI-000235'], nist: ['AC-6(1)', 'AC-6(10)']},
  // CKV_K8S_6: Do not admit root containers
  'CKV_K8S_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_68: Ensure that the --anonymous-auth argument is set to false
  'CKV_K8S_68': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_69: Ensure that the --basic-auth-file argument is not set
  'CKV_K8S_69': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_7: Do not admit containers with the NET_RAW capability
  'CKV_K8S_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_70: Ensure that the --token-auth-file argument is not set
  'CKV_K8S_70': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_71: Ensure that the --kubelet-https argument is set to true
  'CKV_K8S_71': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_72: Ensure that the --kubelet-client-certificate and --kubelet-client-key argumen...
  'CKV_K8S_72': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_K8S_73: Ensure that the --kubelet-certificate-authority argument is set as appropriate
  'CKV_K8S_73': {cci: ['CCI-002420', 'CCI-002451'], nist: ['SC-8(1)', 'SC-12(1)']},
  // CKV_K8S_74: Ensure that the --authorization-mode argument is not set to AlwaysAllow
  'CKV_K8S_74': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_75: Ensure that the --authorization-mode argument includes Node
  'CKV_K8S_75': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_77: Ensure that the --authorization-mode argument includes RBAC
  'CKV_K8S_77': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_78: Ensure that the admission control plugin EventRateLimit is set
  'CKV_K8S_78': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_79: Ensure that the admission control plugin AlwaysAdmit is not set
  'CKV_K8S_79': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_8: Liveness Probe Should be Configured
  'CKV_K8S_8': {cci: ['CCI-002687', 'CCI-000555'], nist: ['SI-4(5)', 'CP-10(2)']},
  // CKV_K8S_80: Ensure that the admission control plugin AlwaysPullImages is set
  'CKV_K8S_80': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_81: Ensure that the admission control plugin SecurityContextDeny is set if PodSec...
  'CKV_K8S_81': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_82: Ensure that the admission control plugin ServiceAccount is set
  'CKV_K8S_82': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_83: Ensure that the admission control plugin NamespaceLifecycle is set
  'CKV_K8S_83': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_84: Ensure that the admission control plugin PodSecurityPolicy is set
  'CKV_K8S_84': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_85: Ensure that the admission control plugin NodeRestriction is set
  'CKV_K8S_85': {cci: ['CCI-001515', 'CCI-002700'], nist: ['CM-6(1)', 'SI-7(1)']},
  // CKV_K8S_86: Ensure that the --insecure-bind-address argument is not set
  'CKV_K8S_86': {cci: ['CCI-002169', 'CCI-000764'], nist: ['AC-3(7)', 'IA-2']},
  // CKV_K8S_88: Ensure that the --insecure-port argument is set to 0
  'CKV_K8S_88': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_K8S_89: Ensure that the --secure-port argument is not set to 0
  'CKV_K8S_89': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_9: Readiness Probe Should be Configured
  'CKV_K8S_9': {cci: ['CCI-002687', 'CCI-000555'], nist: ['SI-4(5)', 'CP-10(2)']},
  // CKV_K8S_90: Ensure that the --profiling argument is set to false
  'CKV_K8S_90': {cci: ['CCI-000382'], nist: ['CM-7(1)']},
  // CKV_K8S_91: Ensure that the --audit-log-path argument is set
  'CKV_K8S_91': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_K8S_92: Ensure that the --audit-log-maxage argument is set to 30 or as appropriate
  'CKV_K8S_92': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_K8S_93: Ensure that the --audit-log-maxbackup argument is set to 10 or as appropriate
  'CKV_K8S_93': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_K8S_94: Ensure that the --audit-log-maxsize argument is set to 100 or as appropriate
  'CKV_K8S_94': {cci: ['CCI-000172', 'CCI-000135'], nist: ['AU-12(1)', 'AU-3(1)']},
  // CKV_K8S_95: Ensure that the --request-timeout argument is set as appropriate
  'CKV_K8S_95': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_96: Ensure that the --service-account-lookup argument is set to true
  'CKV_K8S_96': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_97: Ensure that the --service-account-key-file argument is set as appropriate
  'CKV_K8S_97': {cci: ['CCI-001515'], nist: ['CM-6(1)']},
  // CKV_K8S_99: Ensure that the --etcd-certfile and --etcd-keyfile arguments are set as appro...
  'CKV_K8S_99': {cci: ['CCI-002420', 'CCI-002451'], nist: ['SC-8(1)', 'SC-12(1)']},
  // CKV_LIN_1: Ensure no hard coded Linode tokens exist in provider
  'CKV_LIN_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_LIN_2: Ensure SSH key set in authorized_keys
  'CKV_LIN_2': {cci: ['CCI-000069', 'CCI-001941'], nist: ['AC-17(2)', 'IA-2(6)']},
  // CKV_LIN_3: Ensure email is set
  'CKV_LIN_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_LIN_4: Ensure username is set
  'CKV_LIN_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_LIN_5: Ensure Inbound Firewall Policy is not set to ACCEPT
  'CKV_LIN_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_LIN_6: Ensure Outbound Firewall Policy is not set to ACCEPT
  'CKV_LIN_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_NCP_1: Ensure HTTP HTTPS Target group defines Healthcheck
  'CKV_NCP_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_NCP_10: Ensure no NACL allow inbound from 0.0.0.0:0 to port 22
  'CKV_NCP_10': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_11: Ensure no NACL allow inbound from 0.0.0.0:0 to port 3389
  'CKV_NCP_11': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_12: An inbound Network ACL rule should not allow ALL ports.
  'CKV_NCP_12': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_NCP_13: Ensure LB Listener uses only secure protocols
  'CKV_NCP_13': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV_NCP_14: Ensure NAS is securely encrypted
  'CKV_NCP_14': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_NCP_15: Ensure Load Balancer Target Group is not using HTTP
  'CKV_NCP_15': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_NCP_16: Ensure Load Balancer isn't exposed to the internet
  'CKV_NCP_16': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_NCP_18: Ensure that auto Scaling groups that are associated with a load balancer, are...
  'CKV_NCP_18': {cci: ['CCI-000557', 'CCI-002386'], nist: ['CP-10(4)', 'SC-5(2)']},
  // CKV_NCP_19: Ensure Naver Kubernetes Service public endpoint disabled
  'CKV_NCP_19': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_NCP_2: Ensure every access control groups rule has a description
  'CKV_NCP_2': {cci: ['CCI-002166'], nist: ['AC-3(4)']},
  // CKV_NCP_20: Ensure Routing Table associated with Web tier subnet have the default route (...
  'CKV_NCP_20': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_NCP_22: Ensure NKS control plane logging enabled for all log types
  'CKV_NCP_22': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_NCP_23: Ensure Server instance should not have public IP.
  'CKV_NCP_23': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_NCP_24: Ensure Load Balancer Listener Using HTTPS
  'CKV_NCP_24': {cci: ['CCI-002420', 'CCI-001099'], nist: ['SC-8(1)', 'SC-7(4)']},
  // CKV_NCP_25: Ensure no access control groups allow inbound from 0.0.0.0:0 to port 80
  'CKV_NCP_25': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_26: Ensure Access Control Group has Access Control Group Rule attached
  'CKV_NCP_26': {cci: ['CCI-002166'], nist: ['AC-3(4)']},
  // CKV_NCP_3: Ensure no security group rules allow outbound traffic to 0.0.0.0/0
  'CKV_NCP_3': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_4: Ensure no access control groups allow inbound from 0.0.0.0:0 to port 22
  'CKV_NCP_4': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_5: Ensure no access control groups allow inbound from 0.0.0.0:0 to port 3389
  'CKV_NCP_5': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_6: Ensure Server instance is encrypted.
  'CKV_NCP_6': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_NCP_7: Ensure Basic Block storage is encrypted.
  'CKV_NCP_7': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_NCP_8: Ensure no NACL allow inbound from 0.0.0.0:0 to port 20
  'CKV_NCP_8': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_NCP_9: Ensure no NACL allow inbound from 0.0.0.0:0 to port 21
  'CKV_NCP_9': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_OCI_1: Ensure no hard coded OCI private key in provider
  'CKV_OCI_1': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_OCI_10: Ensure OCI Object Storage is not Public
  'CKV_OCI_10': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_OCI_11: OCI IAM password policy - must contain lower case
  'CKV_OCI_11': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_OCI_12: OCI IAM password policy - must contain Numeric characters
  'CKV_OCI_12': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_OCI_13: OCI IAM password policy - must contain Special characters
  'CKV_OCI_13': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_OCI_14: OCI IAM password policy - must contain Uppercase characters
  'CKV_OCI_14': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_OCI_15: Ensure OCI File System is Encrypted with a customer Managed Key
  'CKV_OCI_15': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_OCI_16: Ensure VCN has an inbound security list
  'CKV_OCI_16': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OCI_17: Ensure VCN inbound security lists are stateless
  'CKV_OCI_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OCI_18: OCI IAM password policy for local (non-federated) users has a minimum length ...
  'CKV_OCI_18': {cci: ['CCI-000192'], nist: ['IA-5(1)']},
  // CKV_OCI_19: Ensure no security list allow ingress from 0.0.0.0:0 to port 22.
  'CKV_OCI_19': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_OCI_2: Ensure OCI Block Storage Block Volume has backup enabled
  'CKV_OCI_2': {cci: ['CCI-000510'], nist: ['CP-9(1)']},
  // CKV_OCI_20: Ensure no security list allow ingress from 0.0.0.0:0 to port 3389.
  'CKV_OCI_20': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_OCI_21: Ensure security group has stateless ingress security rules
  'CKV_OCI_21': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_OCI_22: Ensure no security groups rules allow ingress from 0.0.0.0/0 to port 22
  'CKV_OCI_22': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_OCI_23: Ensure OCI Data Catalog is configured without overly permissive network access
  'CKV_OCI_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OCI_3: OCI Block Storage Block Volumes are not encrypted with a Customer Managed Key...
  'CKV_OCI_3': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_OCI_4: Ensure OCI Compute Instance boot volume has in-transit data encryption enabled
  'CKV_OCI_4': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_OCI_5: Ensure OCI Compute Instance has Legacy MetaData service endpoint disabled
  'CKV_OCI_5': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_OCI_6: Ensure OCI Compute Instance has monitoring enabled
  'CKV_OCI_6': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_OCI_7: Ensure OCI Object Storage bucket can emit object events
  'CKV_OCI_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OCI_8: Ensure OCI Object Storage has versioning enabled
  'CKV_OCI_8': {cci: ['CCI-000510', 'CCI-000164'], nist: ['CP-9(1)', 'AU-9(2)']},
  // CKV_OCI_9: Ensure OCI Object Storage is encrypted with Customer Managed Key
  'CKV_OCI_9': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_OPENAPI_1: Ensure that securityDefinitions is defined and not empty - version 2.0 files
  'CKV_OPENAPI_1': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_10: Ensure that operation object does not use 'password' flow in OAuth2 authentic...
  'CKV_OPENAPI_10': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_11: Ensure that operation object does not use 'password' flow in OAuth2 authentic...
  'CKV_OPENAPI_11': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_12: Ensure no security definition is using implicit flow on OAuth2, which is depr...
  'CKV_OPENAPI_12': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_13: Ensure security definitions do not use basic auth - version 2.0 files
  'CKV_OPENAPI_13': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_14: Ensure that operation objects do not use 'implicit' flow, which is deprecated...
  'CKV_OPENAPI_14': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_15: Ensure that operation objects do not use basic auth - version 2.0 files
  'CKV_OPENAPI_15': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_16: Ensure that operation objects have 'produces' field defined for GET operation...
  'CKV_OPENAPI_16': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_17: Ensure that operation objects have 'consumes' field defined for PUT, POST and...
  'CKV_OPENAPI_17': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_OPENAPI_18: Ensure that global schemes use 'https' protocol instead of 'http'- version 2....
  'CKV_OPENAPI_18': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_OPENAPI_19: Ensure that global security scope is defined in securityDefinitions - version...
  'CKV_OPENAPI_19': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_2: Ensure that if the security scheme is not of type 'oauth2', the array value m...
  'CKV_OPENAPI_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_20: Ensure that API keys are not sent over cleartext
  'CKV_OPENAPI_20': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_21: Ensure that arrays have a maximum number of items
  'CKV_OPENAPI_21': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_3: Ensure that security schemes don't allow cleartext credentials over unencrypt...
  'CKV_OPENAPI_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_4: Ensure that the global security field has rules defined
  'CKV_OPENAPI_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_5: Ensure that security operations is not empty.
  'CKV_OPENAPI_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_6: Ensure that security requirement defined in securityDefinitions - version 2.0...
  'CKV_OPENAPI_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_7: Ensure that the path scheme does not support unencrypted HTTP connection wher...
  'CKV_OPENAPI_7': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_OPENAPI_8: Ensure that security is not using 'password' flow in OAuth2 authentication - ...
  'CKV_OPENAPI_8': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENAPI_9: Ensure that security scopes of operations are defined in securityDefinitions ...
  'CKV_OPENAPI_9': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENSTACK_1: Ensure no hard coded OpenStack password, token, or application_credential_sec...
  'CKV_OPENSTACK_1': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_OPENSTACK_2: Ensure no security groups allow ingress from 0.0.0.0:0 to port 22 (tcp / udp)
  'CKV_OPENSTACK_2': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_OPENSTACK_3: Ensure no security groups allow ingress from 0.0.0.0:0 to port 3389 (tcp / udp)
  'CKV_OPENSTACK_3': {cci: ['CCI-001100'], nist: ['SC-7(5)']},
  // CKV_OPENSTACK_4: Ensure that instance does not use basic credentials
  'CKV_OPENSTACK_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_OPENSTACK_5: Ensure firewall rule set a destination IP
  'CKV_OPENSTACK_5': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_PAN_1: Ensure no hard coded PAN-OS credentials exist in provider
  'CKV_PAN_1': {cci: ['CCI-000190', 'CCI-001515'], nist: ['IA-5(7)', 'CM-6(1)']},
  // CKV_PAN_10: Ensure logging at session end is enabled within security policies
  'CKV_PAN_10': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_PAN_11: Ensure IPsec profiles do not specify use of insecure encryption algorithms
  'CKV_PAN_11': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_PAN_12: Ensure IPsec profiles do not specify use of insecure authentication algorithms
  'CKV_PAN_12': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_13: Ensure IPsec profiles do not specify use of insecure protocols
  'CKV_PAN_13': {cci: ['CCI-002420'], nist: ['SC-8(1)']},
  // CKV_PAN_14: Ensure a Zone Protection Profile is defined within Security Zones
  'CKV_PAN_14': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_15: Ensure an Include ACL is defined for a Zone when User-ID is enabled
  'CKV_PAN_15': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_16: Ensure logging at session start is disabled within security policies except f...
  'CKV_PAN_16': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_PAN_17: Ensure security rules do not have 'source_zone' and 'destination_zone' both c...
  'CKV_PAN_17': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_2: Ensure plain-text management HTTP is not enabled for an Interface Management ...
  'CKV_PAN_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_3: Ensure plain-text management Telnet is not enabled for an Interface Managemen...
  'CKV_PAN_3': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_4: Ensure DSRI is not enabled within security policies
  'CKV_PAN_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_5: Ensure security rules do not have 'applications' set to 'any'
  'CKV_PAN_5': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_6: Ensure security rules do not have 'services' set to 'any'
  'CKV_PAN_6': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_7: Ensure security rules do not have 'source_addresses' and 'destination_address...
  'CKV_PAN_7': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_8: Ensure description is populated within security policies
  'CKV_PAN_8': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_PAN_9: Ensure a Log Forwarding Profile is selected for each security policy rule
  'CKV_PAN_9': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_SECRET_1: Artifactory Credentials
  'CKV_SECRET_1': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_11: Mailchimp Access Key
  'CKV_SECRET_11': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_12: NPM tokens
  'CKV_SECRET_12': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_13: Private Key
  'CKV_SECRET_13': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_14: Slack Token
  'CKV_SECRET_14': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_15: SoftLayer Credentials
  'CKV_SECRET_15': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_16: Square OAuth Secret
  'CKV_SECRET_16': {cci: ['CCI-001957', 'CCI-001954'], nist: ['IA-2(12)', 'IA-8(2)']},
  // CKV_SECRET_17: Stripe Access Key
  'CKV_SECRET_17': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_18: Twilio API Key
  'CKV_SECRET_18': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_19: Hex High Entropy String
  'CKV_SECRET_19': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_2: AWS Access Key
  'CKV_SECRET_2': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_3: Azure Storage Account access key
  'CKV_SECRET_3': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_4: Basic Auth Credentials
  'CKV_SECRET_4': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_5: Cloudant Credentials
  'CKV_SECRET_5': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_6: Base64 High Entropy String
  'CKV_SECRET_6': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_7: IBM Cloud IAM Key
  'CKV_SECRET_7': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_8: IBM COS HMAC Credentials
  'CKV_SECRET_8': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_SECRET_9: JSON Web Token
  'CKV_SECRET_9': {cci: ['CCI-000190', 'CCI-002476'], nist: ['IA-5(7)', 'SC-28(1)']},
  // CKV_TC_1: Ensure Tencent Cloud CBS is encrypted
  'CKV_TC_1': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_TC_10: Ensure Tencent Cloud MySQL instances intranet ports are not set to the defaul...
  'CKV_TC_10': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_TC_11: Ensure Tencent Cloud CLB has a logging ID and topic
  'CKV_TC_11': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_TC_12: Ensure Tencent Cloud CLBs use modern, encrypted protocols
  'CKV_TC_12': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_TC_13: Ensure Tencent Cloud CVM user data does not contain sensitive information
  'CKV_TC_13': {cci: ['CCI-002476', 'CCI-001821'], nist: ['SC-28(1)', 'MP-4']},
  // CKV_TC_14: Ensure Tencent Cloud VPC flow logs are enabled
  'CKV_TC_14': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_TC_2: Ensure Tencent Cloud CVM instance does not allocate a public IP
  'CKV_TC_2': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_TC_3: Ensure Tencent Cloud CVM monitor service is enabled
  'CKV_TC_3': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_TC_4: Ensure Tencent Cloud CVM instances do not use the default security group
  'CKV_TC_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_TC_5: Ensure Tencent Cloud CVM instances do not use the default VPC
  'CKV_TC_5': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_TC_6: Ensure Tencent Cloud TKE clusters enable log agent
  'CKV_TC_6': {cci: ['CCI-000130', 'CCI-000169'], nist: ['AU-2', 'AU-12']},
  // CKV_TC_7: Ensure Tencent Cloud TKE cluster is not assigned a public IP address
  'CKV_TC_7': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_TC_8: Ensure Tencent Cloud VPC security group rules do not accept all traffic
  'CKV_TC_8': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_TC_9: Ensure Tencent Cloud mysql instances do not enable access from public networks
  'CKV_TC_9': {cci: ['CCI-000213', 'CCI-001100'], nist: ['AC-3', 'SC-7(5)']},
  // CKV_TF_1: Ensure Terraform module sources use a commit hash
  'CKV_TF_1': {cci: ['CCI-002705', 'CCI-003610'], nist: ['SI-7(6)', 'SR-3']},
  // CKV_TF_2: Ensure Terraform module sources use a tag with a version number
  'CKV_TF_2': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_YC_1: Ensure security group is assigned to database cluster.
  'CKV_YC_1': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_10: Ensure etcd database is encrypted with KMS key.
  'CKV_YC_10': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
  // CKV_YC_11: Ensure security group is assigned to network interface.
  'CKV_YC_11': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_12: Ensure public IP is not assigned to database cluster.
  'CKV_YC_12': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_YC_13: Ensure cloud member does not have elevated access.
  'CKV_YC_13': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_YC_14: Ensure security group is assigned to Kubernetes cluster.
  'CKV_YC_14': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_15: Ensure security group is assigned to Kubernetes node group.
  'CKV_YC_15': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_16: Ensure network policy is assigned to Kubernetes cluster.
  'CKV_YC_16': {cci: ['CCI-001098'], nist: ['SC-7(3)']},
  // CKV_YC_17: Ensure storage bucket does not have public access permissions.
  'CKV_YC_17': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_YC_18: Ensure compute instance group does not have public IP.
  'CKV_YC_18': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_YC_19: Ensure security group does not contain allow-all rules.
  'CKV_YC_19': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_2: Ensure compute instance does not have public IP.
  'CKV_YC_2': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_YC_20: Ensure security group rule is not allow-all.
  'CKV_YC_20': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_21: Ensure organization member does not have elevated access.
  'CKV_YC_21': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_YC_22: Ensure compute instance group has security group assigned.
  'CKV_YC_22': {cci: ['CCI-001099'], nist: ['SC-7(4)']},
  // CKV_YC_23: Ensure folder member does not have elevated access.
  'CKV_YC_23': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_YC_24: Ensure passport account is not used for assignment. Use service accounts and ...
  'CKV_YC_24': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_YC_3: Ensure storage bucket is encrypted.
  'CKV_YC_3': {cci: ['CCI-002450'], nist: ['SC-13']},
  // CKV_YC_4: Ensure compute instance does not have serial console enabled.
  'CKV_YC_4': {cci: ['CCI-000366'], nist: ['CM-6']},
  // CKV_YC_5: Ensure Kubernetes cluster does not have public IP address.
  'CKV_YC_5': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_YC_6: Ensure Kubernetes cluster node group does not have public IP addresses.
  'CKV_YC_6': {cci: ['CCI-001100', 'CCI-000213'], nist: ['SC-7(5)', 'AC-3']},
  // CKV_YC_7: Ensure Kubernetes cluster auto-upgrade is enabled.
  'CKV_YC_7': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_YC_8: Ensure Kubernetes node group auto-upgrade is enabled.
  'CKV_YC_8': {cci: ['CCI-002607'], nist: ['SI-2(2)']},
  // CKV_YC_9: Ensure KMS symmetric key is rotated.
  'CKV_YC_9': {cci: ['CCI-002476', 'CCI-002451'], nist: ['SC-28(1)', 'SC-12(1)']},
};
