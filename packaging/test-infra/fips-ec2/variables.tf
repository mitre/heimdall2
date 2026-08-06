variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ami_id" {
  description = "RHEL 9 AMI (default: RHEL-9.4.0_HVM x86_64, us-east-1)"
  type        = string
  default     = "ami-03137f1c4d12e4ac5"
}

variable "instance_type" {
  description = "Instance type. t3.medium suffices for the FIPS spike; resize (stop -> modify -> start) only if an RPM build proves it needs more."
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
  default     = "aaronl-aws"
}

variable "subnet_id" {
  description = "Subnet (us-east-1a; t3 not offered in us-east-1e)"
  type        = string
  default     = "subnet-16bbda4b"
}

variable "security_group_id" {
  description = "Security group with SSH ingress"
  type        = string
  default     = "sg-75232501"
}

variable "fips" {
  description = "Enable FIPS mode at first boot (fips-mode-setup --enable + reboot). The host is FIPS-on before it is ever reachable."
  type        = bool
  default     = true
}

variable "volume_gb" {
  description = "Root volume size in GB"
  type        = number
  default     = 50
}

variable "name" {
  description = "Name tag"
  type        = string
  default     = "heimdall-fips-dev"
}
