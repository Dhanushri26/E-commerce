# -----------------------------------------------------------------------------
# File: modules/sns/main.tf
# Why this file exists:
# This module creates the payment SNS topic and subscribes the notification
# Lambda so invoice generation can happen asynchronously.
#
# What this file creates:
# - One SNS topic
# - One Lambda subscription to the topic
# - One Lambda permission so SNS can invoke the notification function
#
# Why SNS is useful:
# SNS is a simple publish/subscribe service. One service can publish an event,
# and one or more subscribers can react to it without tightly coupling the
# services together.
#
# How the notification Lambda subscribes:
# Terraform creates an SNS subscription that points to the notification Lambda
# ARN, then adds a Lambda permission allowing SNS to invoke that function.
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "this" {
  name = var.topic_name
  tags = var.tags
}

resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowSnsInvokeNotification"
  action        = "lambda:InvokeFunction"
  function_name = var.notification_lambda_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.this.arn
}

resource "aws_sns_topic_subscription" "notification_lambda" {
  topic_arn = aws_sns_topic.this.arn
  protocol  = "lambda"
  endpoint  = var.notification_lambda_arn

  depends_on = [aws_lambda_permission.allow_sns]
}
