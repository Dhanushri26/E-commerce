# -----------------------------------------------------------------------------
# File: variables.tf
# Why this file exists:
# Variables make Terraform projects reusable and easier to understand. Instead
# of hardcoding values everywhere, we define inputs in one place and reference
# them throughout the project.
#
# What this file creates:
# This file does not create AWS resources. It defines the values that other
# files and modules will use when creating AWS resources.
#
# Why each variable block is needed:
# Each variable represents a setting we may want to change later without
# rewriting Terraform code, such as the AWS Region, project name for tags,
# Lambda package paths, and default Lambda settings.
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "The AWS Region where the JewelCart resources already exist and where Terraform will manage them."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "The learning project name. This is used only in tags and documentation, not as AWS resource names."
  type        = string
  default     = "E-commerce"
}

variable "common_tags" {
  description = "Common tags applied to resources so they are easier to identify in the AWS console."
  type        = map(string)
  default = {
    Project     = "E-commerce"
    ManagedBy   = "Terraform"
    Environment = "Learning"
  }
}

variable "default_lambda_runtime" {
  description = "The default runtime used by the Lambda functions."
  type        = string
  default     = "nodejs20.x"
}

variable "default_lambda_memory_size" {
  description = "The default amount of memory, in MB, assigned to each Lambda function."
  type        = number
  default     = 256
}

variable "default_lambda_timeout" {
  description = "The default maximum execution time, in seconds, for each Lambda function."
  type        = number
  default     = 15
}

variable "api_stage_name" {
  description = "The stage name used when publishing the REST API."
  type        = string
  default     = "v1"
}

variable "cart_lambda_package" {
  description = "Local path to the ZIP file for the cart Lambda deployment package."
  type        = string
}

variable "products_lambda_package" {
  description = "Local path to the ZIP file for the products Lambda deployment package."
  type        = string
}

variable "inventory_lambda_package" {
  description = "Local path to the ZIP file for the inventory Lambda deployment package."
  type        = string
}

variable "payment_lambda_package" {
  description = "Local path to the ZIP file for the payment Lambda deployment package."
  type        = string
}

variable "order_lambda_package" {
  description = "Local path to the ZIP file for the order Lambda deployment package."
  type        = string
}

variable "notification_lambda_package" {
  description = "Local path to the ZIP file for the notification Lambda deployment package."
  type        = string
}
