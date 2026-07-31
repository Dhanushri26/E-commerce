# -----------------------------------------------------------------------------
# File: modules/dynamodb/variables.tf
# Why this file exists:
# This file defines the names and tags needed by the DynamoDB module.
#
# What this file creates:
# No AWS resources directly. It defines the inputs used by the module.
#
# Why each variable block is needed:
# Each table name is a separate variable so the names are visible and easy for
# beginners to trace back to the existing AWS environment.
# -----------------------------------------------------------------------------

variable "cart_table_name" {
  description = "The exact name of the cart DynamoDB table."
  type        = string
}

variable "inventory_table_name" {
  description = "The exact name of the inventory DynamoDB table."
  type        = string
}

variable "orders_table_name" {
  description = "The exact name of the orders DynamoDB table."
  type        = string
}

variable "payments_table_name" {
  description = "The exact name of the payments DynamoDB table."
  type        = string
}

variable "products_table_name" {
  description = "The exact name of the products DynamoDB table."
  type        = string
}

variable "users_table_name" {
  description = "The exact name of the users DynamoDB table."
  type        = string
}

variable "manage_server_side_encryption" {
  description = "When true, Terraform manages the DynamoDB server-side encryption block."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to all DynamoDB tables."
  type        = map(string)
  default     = {}
}
