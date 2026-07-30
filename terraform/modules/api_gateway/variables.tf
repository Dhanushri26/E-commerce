# -----------------------------------------------------------------------------
# File: modules/api_gateway/variables.tf
# Why this file exists:
# This file defines the inputs needed by the API Gateway module.
#
# What this file creates:
# No AWS resources directly. It defines the values that the module consumes.
#
# Why each variable block is needed:
# API Gateway needs the API name, stage name, and Lambda integration details in
# order to expose the backend services over HTTP.
# -----------------------------------------------------------------------------

variable "api_name" {
  description = "The exact name of the REST API."
  type        = string
}

variable "stage_name" {
  description = "The stage name used when publishing the REST API."
  type        = string
}

variable "aws_region" {
  description = "The AWS Region where the API is deployed."
  type        = string
}

variable "cart_lambda_name" {
  description = "The cart Lambda function name used for invoke permissions."
  type        = string
}

variable "cart_lambda_invoke_arn" {
  description = "The invoke ARN for the cart Lambda integration."
  type        = string
}

variable "products_lambda_name" {
  description = "The products Lambda function name used for invoke permissions."
  type        = string
}

variable "products_lambda_invoke_arn" {
  description = "The invoke ARN for the products Lambda integration."
  type        = string
}

variable "inventory_lambda_name" {
  description = "The inventory Lambda function name used for invoke permissions."
  type        = string
}

variable "inventory_lambda_invoke_arn" {
  description = "The invoke ARN for the inventory Lambda integration."
  type        = string
}

variable "payment_lambda_name" {
  description = "The payment Lambda function name used for invoke permissions."
  type        = string
}

variable "payment_lambda_invoke_arn" {
  description = "The invoke ARN for the payment Lambda integration."
  type        = string
}

variable "order_lambda_name" {
  description = "The order Lambda function name used for invoke permissions."
  type        = string
}

variable "order_lambda_invoke_arn" {
  description = "The invoke ARN for the order Lambda integration."
  type        = string
}

variable "tags" {
  description = "Tags applied to API Gateway resources."
  type        = map(string)
  default     = {}
}
