output "order_queue_url" {
  value = aws_sqs_queue.order_queue.url
}

output "order_queue_arn" {
  value = aws_sqs_queue.order_queue.arn
}

output "order_dlq_url" {
  value = aws_sqs_queue.order_dlq.url
}

output "order_dlq_arn" {
  value = aws_sqs_queue.order_dlq.arn
}

output "payment_topic_arn" {
  value = aws_sns_topic.payment_topic.arn
}

output "payment_topic_name" {
  value = aws_sns_topic.payment_topic.name
}
