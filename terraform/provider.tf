# -----------------------------------------------------------------------------
# File: provider.tf
# Why this file exists:
# Terraform needs a provider block to know which cloud platform we want to talk
# to. In this project, that cloud platform is AWS.
#
# What this file creates:
# This file does not create AWS resources by itself. It only tells Terraform
# how to connect to AWS so the resource blocks in other files can work.
#
# Why this Terraform block is needed:
# The AWS provider is the plugin that translates Terraform code into AWS API
# calls. Without it, Terraform would not know how to create or manage Lambda,
# DynamoDB, API Gateway, S3, IAM, SQS, or SNS resources.
# -----------------------------------------------------------------------------

provider "aws" {
  # We keep the AWS Region in a variable so beginners can see how provider
  # settings can be changed without editing resource code.
  region = var.aws_region
}
