# -----------------------------------------------------------------------------
# File: modules/sqs/outputs.tf
# Why this file exists:
# Outputs make the queue identifiers available to the root module and learners.
#
# What this file creates:
# This file creates Terraform outputs for the SQS module.
#
# Why each output block is needed:
# Queue names, URLs, and ARNs are useful for application configuration and
# troubleshooting.
# -----------------------------------------------------------------------------

output "queue_name" {
  description = "The name of the SQS queue."
  value       = aws_sqs_queue.this.name
}

output "queue_url" {
  description = "The URL of the SQS queue."
  value       = aws_sqs_queue.this.id
}

output "queue_arn" {
  description = "The ARN of the SQS queue."
  value       = aws_sqs_queue.this.arn
}
