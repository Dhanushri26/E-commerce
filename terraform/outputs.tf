# API Gateway Base URL
output "api_gateway_url" {
  value       = module.api_gateway.api_endpoint
  description = "Base URL of the AWS API Gateway"
}

# Cognito Authentication Details
output "cognito_user_pool_id" {
  value       = module.cognito.user_pool_id
  description = "Cognito User Pool ID"
}

output "cognito_user_pool_client_id" {
  value       = module.cognito.client_id
  description = "Cognito User Pool App Client ID"
}

# Messaging & Queues
output "sqs_order_queue_url" {
  value       = module.messaging.order_queue_url
  description = "SQS Order Queue URL"
}

output "sns_payment_topic_arn" {
  value       = module.messaging.payment_topic_arn
  description = "SNS Payment Notification Topic ARN"
}

# DynamoDB Tables
output "dynamodb_tables" {
  value = {
    shared    = module.dynamodb.shared_table_name
    product   = module.dynamodb.product_table_name
    cart      = module.dynamodb.cart_table_name
    order     = module.dynamodb.order_table_name
    payment   = module.dynamodb.payment_table_name
    inventory = module.dynamodb.inventory_table_name
    user      = module.dynamodb.user_table_name
  }
  description = "Summary of provisioned DynamoDB table names"
}

# Frontend Distribution
output "frontend_s3_bucket" {
  value       = module.frontend_s3.bucket_name
  description = "S3 bucket for frontend asset deployment"
}

output "frontend_cloudfront_url" {
  value       = "https://${module.frontend_s3.cloudfront_domain_name}"
  description = "CloudFront CDN URL for React frontend application"
}
