# -----------------------------------------------------------------------------
# File: modules/s3/outputs.tf
# Why this file exists:
# Outputs expose the bucket names so the root module can pass them to other
# resources, such as Lambda environment variables.
#
# What this file creates:
# This file creates Terraform outputs for the S3 module.
#
# Why each output block is needed:
# Bucket names are commonly reused in application configuration.
# -----------------------------------------------------------------------------

output "frontend_bucket_name" {
  description = "The name of the frontend bucket."
  value       = aws_s3_bucket.frontend.bucket
}

output "invoices_bucket_name" {
  description = "The name of the invoices bucket."
  value       = aws_s3_bucket.invoices.bucket
}
