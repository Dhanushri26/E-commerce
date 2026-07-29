output "bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "S3 bucket name for frontend static deployment"
}

output "bucket_arn" {
  value       = aws_s3_bucket.frontend.arn
  description = "S3 bucket ARN"
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.frontend_cdn.domain_name
  description = "CloudFront distribution domain name"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend_cdn.id
  description = "CloudFront distribution ID"
}
