output "api_endpoint" {
  value       = aws_apigatewayv2_api.http_api.api_endpoint
  description = "Base URL of API Gateway"
}

output "api_id" {
  value       = aws_apigatewayv2_api.http_api.id
  description = "API Gateway ID"
}
