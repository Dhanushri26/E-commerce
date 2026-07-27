output "product_service_arn" {
  value = aws_lambda_function.product_service.arn
}
output "product_service_name" {
  value = aws_lambda_function.product_service.function_name
}
output "product_service_invoke_arn" {
  value = aws_lambda_function.product_service.invoke_arn
}

output "cart_service_arn" {
  value = aws_lambda_function.cart_service.arn
}
output "cart_service_name" {
  value = aws_lambda_function.cart_service.function_name
}
output "cart_service_invoke_arn" {
  value = aws_lambda_function.cart_service.invoke_arn
}

output "order_service_arn" {
  value = aws_lambda_function.order_service.arn
}
output "order_service_name" {
  value = aws_lambda_function.order_service.function_name
}
output "order_service_invoke_arn" {
  value = aws_lambda_function.order_service.invoke_arn
}

output "payment_service_arn" {
  value = aws_lambda_function.payment_service.arn
}
output "payment_service_name" {
  value = aws_lambda_function.payment_service.function_name
}
output "payment_service_invoke_arn" {
  value = aws_lambda_function.payment_service.invoke_arn
}

output "inventory_service_arn" {
  value = aws_lambda_function.inventory_service.arn
}
output "inventory_service_name" {
  value = aws_lambda_function.inventory_service.function_name
}
output "inventory_service_invoke_arn" {
  value = aws_lambda_function.inventory_service.invoke_arn
}
