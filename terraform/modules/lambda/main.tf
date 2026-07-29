# ----------------------------------------------------
# ZIP ARCHIVE DATA SOURCES
# ----------------------------------------------------
data "archive_file" "product_service" {
  type        = "zip"
  source_dir  = "${var.project_root_dir}/product-service"
  output_path = "${path.module}/builds/product-service.zip"
}

data "archive_file" "cart_service" {
  type        = "zip"
  source_dir  = "${var.project_root_dir}/cart-service"
  output_path = "${path.module}/builds/cart-service.zip"
}

data "archive_file" "order_service" {
  type        = "zip"
  source_dir  = "${var.project_root_dir}/order-service"
  output_path = "${path.module}/builds/order-service.zip"
}

data "archive_file" "payment_service" {
  type        = "zip"
  source_dir  = "${var.project_root_dir}/payment-service"
  output_path = "${path.module}/builds/payment-service.zip"
}

data "archive_file" "inventory_service" {
  type        = "zip"
  source_dir  = "${var.project_root_dir}/inventory-service"
  output_path = "${path.module}/builds/inventory-service.zip"
}

# ----------------------------------------------------
# COMMON LAMBDA ENVIRONMENT VARIABLES
# ----------------------------------------------------
locals {
  common_env_vars = {
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = var.shared_table_name
    PRODUCT_TABLE       = var.product_table_name
    CART_TABLE          = var.cart_table_name
    ORDER_TABLE         = var.order_table_name
    PAYMENT_TABLE       = var.payment_table_name
    INVENTORY_TABLE     = var.inventory_table_name
    USER_TABLE          = var.user_table_name
    ORDER_QUEUE_URL     = var.order_queue_url
    PAYMENT_TOPIC_ARN   = var.payment_topic_arn
  }
}

# ----------------------------------------------------
# LAMBDA FUNCTIONS
# ----------------------------------------------------

# 1. Product Service
resource "aws_lambda_function" "product_service" {
  filename         = data.archive_file.product_service.output_path
  function_name    = "${var.app_name}-${var.environment}-product-service"
  role             = var.lambda_role_arn
  handler          = "products.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256
  source_code_hash = data.archive_file.product_service.output_base64sha256

  environment {
    variables = local.common_env_vars
  }
}

# 2. Cart Service
resource "aws_lambda_function" "cart_service" {
  filename         = data.archive_file.cart_service.output_path
  function_name    = "${var.app_name}-${var.environment}-cart-service"
  role             = var.lambda_role_arn
  handler          = "cart.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256
  source_code_hash = data.archive_file.cart_service.output_base64sha256

  environment {
    variables = local.common_env_vars
  }
}

# 3. Order Service
resource "aws_lambda_function" "order_service" {
  filename         = data.archive_file.order_service.output_path
  function_name    = "${var.app_name}-${var.environment}-order-service"
  role             = var.lambda_role_arn
  handler          = "orders.handler"
  runtime          = "nodejs20.x"
  timeout          = 20
  memory_size      = 256
  source_code_hash = data.archive_file.order_service.output_base64sha256

  environment {
    variables = local.common_env_vars
  }
}

# 4. Payment Service
resource "aws_lambda_function" "payment_service" {
  filename         = data.archive_file.payment_service.output_path
  function_name    = "${var.app_name}-${var.environment}-payment-service"
  role             = var.lambda_role_arn
  handler          = "payments.handler"
  runtime          = "nodejs20.x"
  timeout          = 20
  memory_size      = 256
  source_code_hash = data.archive_file.payment_service.output_base64sha256

  environment {
    variables = local.common_env_vars
  }
}

# 5. Inventory Service
resource "aws_lambda_function" "inventory_service" {
  filename         = data.archive_file.inventory_service.output_path
  function_name    = "${var.app_name}-${var.environment}-inventory-service"
  role             = var.lambda_role_arn
  handler          = "inventory.handler"
  runtime          = "nodejs20.x"
  timeout          = 15
  memory_size      = 256
  source_code_hash = data.archive_file.inventory_service.output_base64sha256

  environment {
    variables = local.common_env_vars
  }
}
