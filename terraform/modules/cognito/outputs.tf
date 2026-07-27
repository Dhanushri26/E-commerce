output "user_pool_id" {
  value       = aws_cognito_user_pool.pool.id
  description = "Cognito User Pool ID"
}

output "user_pool_arn" {
  value       = aws_cognito_user_pool.pool.arn
  description = "Cognito User Pool ARN"
}

output "user_pool_endpoint" {
  value       = aws_cognito_user_pool.pool.endpoint
  description = "Cognito User Pool Endpoint"
}

output "client_id" {
  value       = aws_cognito_user_pool_client.client.id
  description = "Cognito User Pool App Client ID"
}
