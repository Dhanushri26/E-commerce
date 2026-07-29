variable "app_name" {
  type        = string
  description = "Application identifier prefix"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "dynamodb_table_arns" {
  type        = list(string)
  description = "List of DynamoDB table ARNs for policy permissions"
}

variable "order_queue_arn" {
  type        = string
  description = "SQS order queue ARN"
}

variable "payment_topic_arn" {
  type        = string
  description = "SNS payment topic ARN"
}
