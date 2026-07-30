# -----------------------------------------------------------------------------
# File: modules/iam/outputs.tf
# Why this file exists:
# The root module needs the IAM role ARN so it can attach the role to each
# Lambda function.
#
# What this file creates:
# This file creates Terraform outputs for the IAM module.
#
# Why each output block is needed:
# The role ARN and role name are common values used by other resources.
# -----------------------------------------------------------------------------

output "role_name" {
  description = "The IAM role name."
  value       = aws_iam_role.this.name
}

output "role_arn" {
  description = "The IAM role ARN."
  value       = aws_iam_role.this.arn
}
