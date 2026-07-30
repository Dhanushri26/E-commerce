# -----------------------------------------------------------------------------
# File: modules/dynamodb/outputs.tf
# Why this file exists:
# Outputs make the table names available to the root module and other modules.
#
# What this file creates:
# This file creates Terraform outputs for each DynamoDB table name.
#
# Why each output block is needed:
# The root module uses these outputs when wiring environment variables into the
# Lambda functions.
# -----------------------------------------------------------------------------

output "cart_table_name" {
  description = "The name of the cart table."
  value       = aws_dynamodb_table.cart.name
}

output "inventory_table_name" {
  description = "The name of the inventory table."
  value       = aws_dynamodb_table.inventory.name
}

output "orders_table_name" {
  description = "The name of the orders table."
  value       = aws_dynamodb_table.orders.name
}

output "payments_table_name" {
  description = "The name of the payments table."
  value       = aws_dynamodb_table.payments.name
}

output "products_table_name" {
  description = "The name of the products table."
  value       = aws_dynamodb_table.products.name
}

output "users_table_name" {
  description = "The name of the users table."
  value       = aws_dynamodb_table.users.name
}
