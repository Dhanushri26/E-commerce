# -----------------------------------------------------------------------------
# File: outputs.tf
# Why this file exists:
# Outputs show useful information after Terraform finishes applying changes.
# They are a simple way to discover important values without digging through
# the AWS console.
#
# What this file creates:
# This file does not create AWS resources. It creates Terraform outputs that
# display resource names, ARNs, URLs, and other identifiers.
#
# Why each output block is needed:
# Each output gives you a practical value you are likely to reuse, verify, or
# inspect while learning how the infrastructure fits together.
# -----------------------------------------------------------------------------

output "lambda_names" {
  description = "The names of all Lambda functions managed by this project."
  value = {
    cart         = module.cart_lambda.function_name
    products     = module.products_lambda.function_name
    inventory    = module.inventory_lambda.function_name
    payment      = module.payment_lambda.function_name
    order        = module.order_lambda.function_name
    notification = module.notification_lambda.function_name
  }
}

output "lambda_arns" {
  description = "The ARNs of all Lambda functions managed by this project."
  value = {
    cart         = module.cart_lambda.function_arn
    products     = module.products_lambda.function_arn
    inventory    = module.inventory_lambda.function_arn
    payment      = module.payment_lambda.function_arn
    order        = module.order_lambda.function_arn
    notification = module.notification_lambda.function_arn
  }
}

output "api_gateway_id" {
  description = "The REST API ID."
  value       = module.api_gateway.api_id
}

output "dynamodb_table_names" {
  description = "The names of the DynamoDB tables used by the application."
  value = {
    cart      = module.dynamodb.cart_table_name
    inventory = module.dynamodb.inventory_table_name
    orders    = module.dynamodb.orders_table_name
    payments  = module.dynamodb.payments_table_name
    products  = module.dynamodb.products_table_name
    users     = module.dynamodb.users_table_name
  }
}

output "queue_url" {
  description = "The URL of the order queue."
  value       = var.manage_sqs ? module.sqs[0].queue_url : "Not managed by Terraform. Expected queue URL: https://sqs.${var.aws_region}.amazonaws.com/${data.aws_caller_identity.current.account_id}/jewelcart-order-queue"
}

output "topic_arn" {
  description = "The ARN of the payment SNS topic."
  value       = var.manage_sns ? module.sns[0].topic_arn : "Not managed by Terraform. Expected topic ARN: arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:jewelcart-payment-topic"
}

output "bucket_names" {
  description = "The names of the S3 buckets used by the application."
  value = {
    frontend = module.s3.frontend_bucket_name
    invoices = module.s3.invoices_bucket_name
  }
}
