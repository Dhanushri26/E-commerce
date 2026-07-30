# -----------------------------------------------------------------------------
# File: modules/s3/main.tf
# Why this file exists:
# This module creates the two S3 buckets used by the application.
#
# What this file creates:
# - jewelcart-frontend-dhanu
# - jewelcart-invoices-dhanu26
# - Versioning configuration for both buckets
# - Default server-side encryption for both buckets
#
# Why each Terraform block is needed:
# We create the bucket first, then configure versioning and encryption as
# separate resources because that is how the AWS provider models them.
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    # Versioning is recommended because it protects against accidental
    # overwrites and makes rollback easier.
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      # AES256 is the simplest built-in encryption option for beginners.
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket" "invoices" {
  bucket = var.invoices_bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "invoices" {
  bucket = aws_s3_bucket.invoices.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
