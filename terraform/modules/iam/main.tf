# -----------------------------------------------------------------------------
# File: modules/iam/main.tf
# Why this file exists:
# This module creates the IAM role used by the Lambda functions.
#
# What this file creates:
# - One IAM role
# - One inline IAM policy with least-privilege permissions for this project
#
# Why each Terraform block is needed:
# Lambda functions cannot access AWS services unless IAM allows them to do so.
# The assume role policy lets Lambda assume the role, and the permissions policy
# defines what the Lambda code is allowed to access.
# -----------------------------------------------------------------------------

data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "this" {
  name               = var.role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "lambda_permissions" {
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    sid    = "AllowDynamoDbAccess"
    effect = "Allow"

    actions = [
      "dynamodb:BatchWriteItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:TransactWriteItems",
      "dynamodb:UpdateItem",
    ]

    resources = var.dynamodb_resource_arns
  }

  statement {
    sid    = "AllowSqsAccess"
    effect = "Allow"

    actions = [
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ReceiveMessage",
      "sqs:SendMessage",
    ]

    resources = [var.queue_arn]
  }

  statement {
    sid    = "AllowSnsPublish"
    effect = "Allow"

    actions = [
      "sns:Publish",
    ]

    resources = [var.topic_arn]
  }

  statement {
    sid    = "AllowS3BucketListing"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
    ]

    resources = var.s3_bucket_arns
  }

  statement {
    sid    = "AllowS3ObjectAccess"
    effect = "Allow"

    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
    ]

    resources = var.s3_object_arns
  }
}

resource "aws_iam_role_policy" "this" {
  name   = "${var.role_name}-policy"
  role   = aws_iam_role.this.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}
