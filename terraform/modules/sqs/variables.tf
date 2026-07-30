# -----------------------------------------------------------------------------
# File: modules/sqs/variables.tf
# Why this file exists:
# This file defines the queue name and inventory Lambda details required by the
# SQS module.
#
# What this file creates:
# No AWS resources directly. It only defines inputs for the module.
#
# Why each variable block is needed:
# The queue has to know its fixed name, and the event source mapping needs the
# Lambda information so it can connect the queue to the inventory processor.
# -----------------------------------------------------------------------------

variable "queue_name" {
  description = "The exact name of the SQS queue."
  type        = string
}

variable "inventory_lambda_arn" {
  description = "The ARN of the inventory Lambda function that consumes queue messages."
  type        = string
}

variable "tags" {
  description = "Tags applied to the SQS queue."
  type        = map(string)
  default     = {}
}
