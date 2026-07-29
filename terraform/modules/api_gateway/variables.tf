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

variable "cognito_user_pool_id" {
  type        = string
  description = "Cognito User Pool ID"
}

variable "cognito_client_id" {
  type        = string
  description = "Cognito User Pool Client ID"
}

variable "product_service_invoke_arn" {
  type        = string
  description = "Product Service Lambda Invoke ARN"
}
variable "product_service_name" {
  type        = string
  description = "Product Service Lambda Function Name"
}

variable "cart_service_invoke_arn" {
  type        = string
  description = "Cart Service Lambda Invoke ARN"
}
variable "cart_service_name" {
  type        = string
  description = "Cart Service Lambda Function Name"
}

variable "order_service_invoke_arn" {
  type        = string
  description = "Order Service Lambda Invoke ARN"
}
variable "order_service_name" {
  type        = string
  description = "Order Service Lambda Function Name"
}

variable "payment_service_invoke_arn" {
  type        = string
  description = "Payment Service Lambda Invoke ARN"
}
variable "payment_service_name" {
  type        = string
  description = "Payment Service Lambda Function Name"
}

variable "inventory_service_invoke_arn" {
  type        = string
  description = "Inventory Service Lambda Invoke ARN"
}
variable "inventory_service_name" {
  type        = string
  description = "Inventory Service Lambda Function Name"
}
