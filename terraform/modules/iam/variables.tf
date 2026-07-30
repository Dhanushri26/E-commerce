# -----------------------------------------------------------------------------
# File: modules/iam/variables.tf
# Why this file exists:
# This file defines the inputs required to build the Lambda IAM role and
# least-privilege policy.
#
# What this file creates:
# No AWS resources directly. It only defines the values used by the IAM module.
#
# Why each variable block is needed:
# IAM permissions should be scoped to the real resources the application uses,
# so the module accepts exact ARNs for DynamoDB, S3, SQS, and SNS.
# -----------------------------------------------------------------------------

variable "role_name" {
  description = "The exact name of the IAM role used by the Lambda functions."
  type        = string
}

variable "dynamodb_resource_arns" {
  description = "A list of DynamoDB table and index ARNs the Lambda functions can access."
  type        = list(string)
}

variable "s3_bucket_arns" {
  description = "A list of S3 bucket ARNs the Lambda functions can access."
  type        = list(string)
}

variable "s3_object_arns" {
  description = "A list of S3 object ARNs the Lambda functions can access."
  type        = list(string)
}

variable "queue_arn" {
  description = "The ARN of the SQS queue used by the application."
  type        = string
}

variable "topic_arn" {
  description = "The ARN of the SNS topic used by the application."
  type        = string
}

variable "tags" {
  description = "Tags applied to the IAM role."
  type        = map(string)
  default     = {}
}
