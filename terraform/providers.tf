provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ShopSphere"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
