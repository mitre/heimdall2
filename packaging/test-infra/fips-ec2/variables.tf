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
  description = "Name tag — the single identity knob. Set via TF_VAR_name; fips-box and the ssh alias follow it through the same variable."
  type        = string
  default     = "heimdall-fips"
}

variable "idle_stop_minutes" {
  description = "Auto-stop after this many minutes below the CPU threshold (multiple of 5; 0 disables). Restart with: aws ec2 start-instances"
  type        = number
  default     = 45
}

variable "idle_cpu_threshold" {
  description = "CPU % considered idle"
  type        = number
  default     = 3
}
