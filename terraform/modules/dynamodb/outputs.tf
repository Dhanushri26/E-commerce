output "shared_table_name" {
  value = aws_dynamodb_table.shared_table.name
}

output "shared_table_arn" {
  value = aws_dynamodb_table.shared_table.arn
}

output "product_table_name" {
  value = aws_dynamodb_table.product_table.name
}

output "product_table_arn" {
  value = aws_dynamodb_table.product_table.arn
}

output "cart_table_name" {
  value = aws_dynamodb_table.cart_table.name
}

output "cart_table_arn" {
  value = aws_dynamodb_table.cart_table.arn
}

output "order_table_name" {
  value = aws_dynamodb_table.order_table.name
}

output "order_table_arn" {
  value = aws_dynamodb_table.order_table.arn
}

output "payment_table_name" {
  value = aws_dynamodb_table.payment_table.name
}

output "payment_table_arn" {
  value = aws_dynamodb_table.payment_table.arn
}

output "inventory_table_name" {
  value = aws_dynamodb_table.inventory_table.name
}

output "inventory_table_arn" {
  value = aws_dynamodb_table.inventory_table.arn
}

output "user_table_name" {
  value = aws_dynamodb_table.user_table.name
}

output "user_table_arn" {
  value = aws_dynamodb_table.user_table.arn
}
