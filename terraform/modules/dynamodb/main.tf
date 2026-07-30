# -----------------------------------------------------------------------------
# File: modules/dynamodb/main.tf
# Why this file exists:
# This module creates all six DynamoDB tables used by the E-commerce
# application.
#
# What this file creates:
# - jewelcart-cart
# - jewelcart-inventory
# - jewelcart-orders
# - jewelcart-payments
# - jewelcart-products
# - jewelcart-users
#
# Why each Terraform block is needed:
# Every aws_dynamodb_table block defines one table. Repeating the blocks may
# look verbose, but it is very beginner-friendly because each table can be read
# on its own.
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "cart" {
  # This name must stay exactly aligned with the existing AWS table.
  name = var.cart_table_name

  # PAY_PER_REQUEST is the simplest pricing model for beginners because AWS
  # automatically scales read/write capacity based on usage.
  billing_mode = "PAY_PER_REQUEST"

  # These keys define the primary key structure of the table.
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # Encryption at rest is a recommended default for production data.
  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "inventory" {
  name         = var.inventory_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "orders" {
  name         = var.orders_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "payments" {
  name         = var.payments_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "products" {
  name         = var.products_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}

resource "aws_dynamodb_table" "users" {
  name         = var.users_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  tags = var.tags
}
