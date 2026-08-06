output "instance_id" {
  value = aws_instance.fips_host.id
}

output "public_ip" {
  description = "Changes on every stop/start — re-read after starting."
  value       = aws_instance.fips_host.public_ip
}

output "ssh" {
  value = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_instance.fips_host.public_ip}"
}

output "verify_fips" {
  description = "Must print 1 once cloud-init's post-enable reboot completes."
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ec2-user@${aws_instance.fips_host.public_ip} 'cat /proc/sys/crypto/fips_enabled'"
}
