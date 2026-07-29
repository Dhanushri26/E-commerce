
provider "aws" {
  region  = var.aws_region
  profile = "dhanushri"

  default_tags {
    tags = {
      Project     = "ShopSphere"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
