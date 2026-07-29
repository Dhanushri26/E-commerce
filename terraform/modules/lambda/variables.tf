variable "app_name" {
  type        = string
  description = "Application identifier prefix"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
}

variable "lambda_role_arn" {
  type        = string
  description = "IAM Role ARN for Lambda execution"
}

variable "shared_table_name" {
  type        = string
  description = "DynamoDB shared table name (idempotency locks)"
}

variable "product_table_name" {
  type        = string
  description = "DynamoDB product table name"
}

variable "cart_table_name" {
  type        = string
  description = "DynamoDB cart table name"
}

variable "order_table_name" {
  type        = string
  description = "DynamoDB order table name"
}

variable "payment_table_name" {
  type        = string
  description = "DynamoDB payment table name"
}

variable "inventory_table_name" {
  type        = string
  description = "DynamoDB inventory table name"
}

variable "user_table_name" {
  type        = string
  description = "DynamoDB user table name"
}

variable "order_queue_url" {
  type        = string
  description = "SQS order queue URL"
}

variable "payment_topic_arn" {
  type        = string
  description = "SNS payment topic ARN"
}

variable "project_root_dir" {
  type        = string
  description = "Path to project root directory containing service folders"
}
