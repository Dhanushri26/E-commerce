# -----------------------------------------------------------------------------
# File: modules/lambda/main.tf
# Why this file exists:
# This reusable module creates one Lambda function. We use the same module six
# times from the root module so the code stays consistent and easier to learn.
#
# What this file creates:
# - One aws_lambda_function resource
#
# Why each Terraform block is needed:
# - aws_lambda_function defines the actual serverless function in AWS.
# - The environment block passes configuration into the function without
#   hardcoding values directly inside application code.
# -----------------------------------------------------------------------------

resource "aws_lambda_function" "this" {
  # The function name must stay exactly aligned with the real AWS resource.
  function_name = var.function_name

  # filename tells Terraform which local ZIP file contains the Lambda code.
  # We allow null during the initial import stage because the Lambda may
  # already exist in AWS before a local deployment package exists.
  filename = var.filename

  # source_code_hash helps Terraform detect when the ZIP file contents changed.
  # We only calculate the hash when a real file path is available.
  source_code_hash = var.filename != null ? filebase64sha256(var.filename) : null

  # runtime tells AWS which language runtime should execute the code.
  runtime = var.runtime

  # handler tells Lambda which exported function to call first.
  handler = var.handler

  # role is the IAM role the Lambda assumes when it runs.
  role = var.role_arn

  # timeout protects us from functions running forever.
  timeout = var.timeout

  # memory_size controls how much memory the function gets.
  memory_size = var.memory_size

  # Environment variables are a clean way to pass table names, bucket names,
  # queue URLs, topic ARNs, and other configuration into the code.
  environment {
    variables = var.environment_variables
  }

  # Tags make the function easier to find and organize in AWS.
  tags = var.tags
}
