# FIPS-enabled RHEL 9 test host for Heimdall.
#
# Two lifecycle profiles from this one module:
#   - Ephemeral test host: tofu apply -> run tests -> tofu destroy
#   - Dev/test box: tofu apply once, then STOP the instance between sessions
#     (aws ec2 stop-instances). A stopped instance costs only its EBS volume.
#     The public IP changes on every stop/start cycle — re-read the output or
#     `aws ec2 describe-instances` after starting.
#
# Resize on evidence, not speculation: stop -> modify instance type -> start.

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# SSM access — the MITRE network blocks the SSH protocol at the edge (TCP to
# port 22 connects, then the banner exchange is killed; verified 2026-08-06
# against both this host and github.com). Session Manager tunnels over
# HTTPS/443 via the agent's outbound connection, so it works where SSH cannot.
# Minimal role: AmazonSSMManagedInstanceCore and nothing else.
resource "aws_iam_role" "ssm" {
  name = "${var.name}-ssm"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = { Project = "heimdall2-fips" }
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm" {
  name = "${var.name}-ssm"
  role = aws_iam_role.ssm.name
}

resource "aws_instance" "fips_host" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = [var.security_group_id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ssm.name

  user_data = templatefile("${path.module}/user-data.yaml.tftpl", {
    fips = var.fips
  })

  # RHEL AMI default root volume is 10 GB — too small for iterative RPM
  # builds (node_modules + rpmbuild trees). gp3 baseline is fine.
  root_block_device {
    volume_size = var.volume_gb
    volume_type = "gp3"
  }

  # IMDSv2 only.
  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  tags = {
    Name    = var.name
    Project = "heimdall2-fips"
    Purpose = var.fips ? "fips-test-host" : "test-host"
  }
}

# Idle auto-stop — the box must never run up a bill because someone walked
# away. CPU < threshold for the full window -> EC2 stop action. Basic
# monitoring reports in 5-minute periods, so idle_minutes should be a
# multiple of 5. A build or test run burns CPU and can never be stopped
# mid-job; a stop IS a power-off, so detached tmux sessions die with it.
resource "aws_cloudwatch_metric_alarm" "idle_stop" {
  count               = var.idle_stop_minutes > 0 ? 1 : 0
  alarm_name          = "${var.name}-idle-stop"
  alarm_description   = "Stop ${var.name} after ${var.idle_stop_minutes} min below ${var.idle_cpu_threshold}% CPU"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = var.idle_stop_minutes / 5
  threshold           = var.idle_cpu_threshold
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "notBreaching" # already stopped -> no data -> no flapping
  dimensions          = { InstanceId = aws_instance.fips_host.id }
  alarm_actions       = ["arn:aws:automate:${var.region}:ec2:stop"]
  tags                = { Project = "heimdall2-fips" }
}
