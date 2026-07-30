# -----------------------------------------------------------------------------
# File: modules/lambda/variables.tf
# Why this file exists:
# This file defines the inputs needed to create one Lambda function.
#
# What this file creates:
# It creates no AWS resources. It simply describes the values the module needs.
#
# Why each variable block is needed:
# Each variable maps to a real Lambda setting so beginners can clearly see how
# Terraform inputs become AWS configuration.
# -----------------------------------------------------------------------------

variable "function_name" {
  description = "The exact Lambda function name that AWS will manage."
  type        = string
}

variable "filename" {
  description = "The local path to the ZIP deployment package for this Lambda."
  type        = string
}

variable "runtime" {
  description = "The Lambda runtime, such as nodejs20.x."
  type        = string
}

variable "handler" {
  description = "The handler AWS should execute, written as file.exportedFunction."
  type        = string
}

variable "timeout" {
  description = "The maximum number of seconds Lambda can run before AWS stops it."
  type        = number
}

variable "memory_size" {
  description = "The amount of memory, in MB, allocated to the Lambda function."
  type        = number
}

variable "environment_variables" {
  description = "A map of environment variables passed into the Lambda function."
  type        = map(string)
  default     = {}
}

variable "role_arn" {
  description = "The ARN of the IAM role that the Lambda function will assume."
  type        = string
}

variable "tags" {
  description = "Tags applied to the Lambda function."
  type        = map(string)
  default     = {}
}
