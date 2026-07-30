# -----------------------------------------------------------------------------
# File: versions.tf
# Why this file exists:
# This file pins the Terraform CLI version and the AWS provider version so the
# project behaves predictably across different machines.
#
# What this file creates:
# This file does not create AWS resources. It defines version requirements for
# the tooling that Terraform uses.
#
# Why these Terraform blocks are needed:
# - required_version protects us from using an older Terraform CLI that might
#   not support the syntax in this project.
# - required_providers tells Terraform which provider plugin to install.
#
# Teaching note:
# The AWS provider version below is pinned to the latest stable release shown in
# the official Terraform Registry at the time this project was generated:
# July 30, 2026 -> version 6.55.0.
# -----------------------------------------------------------------------------

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.55.0"
    }
  }
}
