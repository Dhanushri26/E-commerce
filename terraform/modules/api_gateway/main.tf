resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.app_name}-${var.environment}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]
    allow_headers = [
      "Content-Type",
      "Authorization",
      "X-Amz-Date",
      "X-Api-Key",
      "X-Amz-Security-Token",
      "x-user-id",
      "x-user-role",
      "x-business-id"
    ]
    max_age = 300
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      sourceIp                = "$context.identity.sourceIp"
      requestTime             = "$context.requestTime"
      httpMethod              = "$context.httpMethod"
      routeKey                = "$context.routeKey"
      status                  = "$context.status"
      protocol                = "$context.protocol"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/v2/apigateway/${var.app_name}-${var.environment}-api"
  retention_in_days = 14
}

# ----------------------------------------------------
# COGNITO JWT AUTHORIZER
# ----------------------------------------------------
resource "aws_apigatewayv2_authorizer" "cognito" {
  api_id           = aws_apigatewayv2_api.http_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt-authorizer"

  jwt_configuration {
    audience = [var.cognito_client_id]
    issuer   = "https://cognito-idp.${var.aws_region}.amazonaws.com/${var.cognito_user_pool_id}"
  }
}

# ----------------------------------------------------
# INTEGRATIONS
# ----------------------------------------------------
resource "aws_apigatewayv2_integration" "product" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.product_service_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "cart" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.cart_service_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "order" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.order_service_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "payment" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.payment_service_invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "inventory" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = var.inventory_service_invoke_arn
  payload_format_version = "2.0"
}

# ----------------------------------------------------
# ROUTES
# ----------------------------------------------------

# Products
resource "aws_apigatewayv2_route" "products_root" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /products"
  target             = "integrations/${aws_apigatewayv2_integration.product.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "products_proxy" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /products/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.product.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Cart
resource "aws_apigatewayv2_route" "cart_root" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /cart"
  target             = "integrations/${aws_apigatewayv2_integration.cart.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "cart_proxy" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /cart/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.cart.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Orders
resource "aws_apigatewayv2_route" "orders_root" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /orders"
  target             = "integrations/${aws_apigatewayv2_integration.order.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "orders_proxy" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /orders/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.order.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Payments
resource "aws_apigatewayv2_route" "payments_root" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /payments"
  target             = "integrations/${aws_apigatewayv2_integration.payment.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "payments_proxy" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /payments/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.payment.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# Inventory
resource "aws_apigatewayv2_route" "inventory_root" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /inventory"
  target             = "integrations/${aws_apigatewayv2_integration.inventory.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

resource "aws_apigatewayv2_route" "inventory_proxy" {
  api_id             = aws_apigatewayv2_api.http_api.id
  route_key          = "ANY /inventory/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.inventory.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito.id
}

# ----------------------------------------------------
# LAMBDA PERMISSIONS FOR API GATEWAY
# ----------------------------------------------------
resource "aws_lambda_permission" "product" {
  statement_id  = "AllowAPIGatewayInvoke-Product"
  action        = "lambda:InvokeFunction"
  function_name = var.product_service_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "cart" {
  statement_id  = "AllowAPIGatewayInvoke-Cart"
  action        = "lambda:InvokeFunction"
  function_name = var.cart_service_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "order" {
  statement_id  = "AllowAPIGatewayInvoke-Order"
  action        = "lambda:InvokeFunction"
  function_name = var.order_service_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "payment" {
  statement_id  = "AllowAPIGatewayInvoke-Payment"
  action        = "lambda:InvokeFunction"
  function_name = var.payment_service_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "inventory" {
  statement_id  = "AllowAPIGatewayInvoke-Inventory"
  action        = "lambda:InvokeFunction"
  function_name = var.inventory_service_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
