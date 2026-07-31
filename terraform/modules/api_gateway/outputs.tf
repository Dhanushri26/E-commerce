# -----------------------------------------------------------------------------
# File: modules/api_gateway/outputs.tf
# Why this file exists:
# The root module needs the API ID and invoke URL after the REST API is
# created.
#
# What this file creates:
# This file creates Terraform outputs for the API Gateway module.
#
# Why each output block is needed:
# The invoke URL is one of the first values beginners usually want after the
# API has been deployed.
# -----------------------------------------------------------------------------

output "api_id" {
  description = "The REST API ID."
  value       = aws_api_gateway_rest_api.this.id
}

