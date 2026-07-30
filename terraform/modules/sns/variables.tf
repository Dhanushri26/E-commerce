# -----------------------------------------------------------------------------
# File: modules/sns/variables.tf
# Why this file exists:
# This file defines the inputs required by the SNS module.
#
# What this file creates:
# No AWS resources directly. It only defines inputs for the topic and
# subscription.
#
# Why each variable block is needed:
# SNS needs the fixed topic name and the notification Lambda details so the
# topic can publish events to the subscribed function.
# -----------------------------------------------------------------------------

variable "topic_name" {
  description = "The exact name of the SNS topic."
  type        = string
}

variable "notification_lambda_arn" {
  description = "The ARN of the notification Lambda subscribed to the topic."
  type        = string
}

variable "notification_lambda_name" {
  description = "The name of the notification Lambda subscribed to the topic."
  type        = string
}

variable "tags" {
  description = "Tags applied to the SNS topic."
  type        = map(string)
  default     = {}
}
