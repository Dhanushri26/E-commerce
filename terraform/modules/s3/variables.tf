# -----------------------------------------------------------------------------
# File: modules/s3/variables.tf
# Why this file exists:
# This file defines the names and tags used by the S3 module.
#
# What this file creates:
# No AWS resources directly. It only defines the inputs for the S3 module.
#
# Why each variable block is needed:
# Each bucket name stays visible and easy to trace back to the existing AWS
# environment.
# -----------------------------------------------------------------------------

variable "frontend_bucket_name" {
  description = "The exact name of the frontend S3 bucket."
  type        = string
}

variable "invoices_bucket_name" {
  description = "The exact name of the invoices S3 bucket."
  type        = string
}

variable "tags" {
  description = "Tags applied to the S3 buckets."
  type        = map(string)
  default     = {}
}
