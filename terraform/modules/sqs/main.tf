# -----------------------------------------------------------------------------
# File: modules/sqs/main.tf
# Why this file exists:
# This module creates the order queue and connects it to the inventory Lambda.
#
# What this file creates:
# - One SQS queue
# - One Lambda event source mapping
#
# Why SQS is used:
# SQS decouples services. The order service can place a message on the queue
# quickly, and the inventory service can process that message asynchronously.
#
# How orders send messages:
# The order Lambda receives the queue URL through an environment variable and
# sends a message to this queue after order events occur.
#
# How inventory consumes messages:
# The Lambda event source mapping continuously polls the queue and invokes the
# inventory Lambda when messages are available.
# -----------------------------------------------------------------------------

resource "aws_sqs_queue" "this" {
  name = var.queue_name

  # The visibility timeout should usually be longer than the Lambda timeout so
  # a message is not made visible again before processing finishes.
  visibility_timeout_seconds = 60

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "inventory_consumer" {
  event_source_arn = aws_sqs_queue.this.arn
  function_name    = var.inventory_lambda_arn

  # A small batch size is easier for beginners to reason about.
  batch_size = 1

  enabled = true
}
