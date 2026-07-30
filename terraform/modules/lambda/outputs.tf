# -----------------------------------------------------------------------------
# File: modules/lambda/outputs.tf
# Why this file exists:
# Outputs let the root module reuse important values from the Lambda resource,
# such as its name, ARN, and invoke ARN.
#
# What this file creates:
# This file creates Terraform outputs for the Lambda module.
#
# Why each output block is needed:
# - function_name is useful for display and integrations.
# - function_arn is useful for permissions and event source mappings.
# - invoke_arn is the special ARN API Gateway uses to call the function.
# -----------------------------------------------------------------------------

output "function_name" {
  description = "The Lambda function name."
  value       = aws_lambda_function.this.function_name
}

output "function_arn" {
  description = "The Lambda function ARN."
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "The Lambda invoke ARN used by API Gateway integrations."
  value       = aws_lambda_function.this.invoke_arn
}
