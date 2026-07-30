# -----------------------------------------------------------------------------
# File: modules/sns/outputs.tf
# Why this file exists:
# Outputs expose the topic details to the root module and anyone learning the
# project.
#
# What this file creates:
# This file creates Terraform outputs for the SNS module.
#
# Why each output block is needed:
# The topic ARN is commonly reused by application code and integrations.
# -----------------------------------------------------------------------------

output "topic_name" {
  description = "The name of the SNS topic."
  value       = aws_sns_topic.this.name
}

output "topic_arn" {
  description = "The ARN of the SNS topic."
  value       = aws_sns_topic.this.arn
}
