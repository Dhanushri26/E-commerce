# Dead-letter queue for failed order events
resource "aws_sqs_queue" "order_dlq" {
  name                      = "${var.app_name}-${var.environment}-order-dlq"
  message_retention_seconds = 1209600 # 14 days
}

# Main SQS queue for order events
resource "aws_sqs_queue" "order_queue" {
  name                       = "${var.app_name}-${var.environment}-order-queue"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 345600 # 4 days

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_dlq.arn
    maxReceiveCount     = 5
  })
}

# SNS Topic for payment notifications
resource "aws_sns_topic" "payment_topic" {
  name = "${var.app_name}-${var.environment}-payment-topic"
}
