variable "aws_region" {
  type        = string
  description = "AWS Region for ShopSphere infrastructure deployment"
  default     = "ap-southeast-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment (e.g., dev, staging, prod)"
  default     = "dev"
}

variable "app_name" {
  type        = string
  description = "Application identifier prefix for resource naming"
  default     = "shopsphere"
}
