# -----------------------------------------------------------------------------
# File: main.tf
# Why this file exists:
# This is the main wiring file for the project. It connects all modules
# together so the individual parts of the application form one working system.
#
# What this file creates:
# - IAM role for the Lambda functions
# - Six DynamoDB tables
# - Two S3 buckets
# - Six Lambda functions
# - One API Gateway REST API
# - One SQS queue and Lambda event source mapping
# - One SNS topic and Lambda subscription
#
# Why these Terraform blocks are needed:
# Each module block keeps one AWS service isolated and easier to understand,
# while this root file shows how the whole E-commerce application is assembled.
# -----------------------------------------------------------------------------

# We read the current AWS account ID so we can build exact ARNs and URLs for
# resources whose names are fixed and already known.
data "aws_caller_identity" "current" {}

locals {
  # The project keeps these existing AWS resource names exactly as provided.
  # We only use the E-commerce name in documentation and tags.
  lambda_function_names = {
    cart         = "JewelCart-cart"
    products     = "JewelCart-products"
    inventory    = "JewelCart-inventory"
    payment      = "JewelCart-payment"
    order        = "JewelCart-order"
    notification = "jewelcart-notification"
  }

  dynamodb_table_names = {
    cart      = "jewelcart-cart"
    inventory = "jewelcart-inventory"
    orders    = "jewelcart-orders"
    payments  = "jewelcart-payments"
    products  = "jewelcart-products"
    users     = "jewelcart-users"
  }

  s3_bucket_names = {
    frontend = "jewelcart-frontend-dhanu"
    invoices = "jewelcart-invoices-dhanu26"
  }

  order_queue_name   = "jewelcart-order-queue"
  payment_topic_name = "jewelcart-payment-topic"
  iam_role_name      = "aws-dhanushri"
  api_name           = "JewelCart-v1-api"

  # These exact identifiers help us avoid circular dependencies between the
  # Lambda functions and the event-driven services that connect to them.
  order_queue_arn   = "arn:aws:sqs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${local.order_queue_name}"
  order_queue_url   = "https://sqs.${var.aws_region}.amazonaws.com/${data.aws_caller_identity.current.account_id}/${local.order_queue_name}"
  payment_topic_arn = "arn:aws:sns:${var.aws_region}:${data.aws_caller_identity.current.account_id}:${local.payment_topic_name}"

  common_tags = merge(
    var.common_tags,
    {
      Project = var.project_name
    }
  )
}

data "aws_iam_role" "existing_lambda_role" {
  count = var.manage_iam_role ? 0 : 1
  name  = local.iam_role_name
}

module "dynamodb" {
  source = "./modules/dynamodb"

  cart_table_name      = local.dynamodb_table_names.cart
  inventory_table_name = local.dynamodb_table_names.inventory
  orders_table_name    = local.dynamodb_table_names.orders
  payments_table_name  = local.dynamodb_table_names.payments
  products_table_name  = local.dynamodb_table_names.products
  users_table_name     = local.dynamodb_table_names.users
  manage_server_side_encryption = var.manage_dynamodb_server_side_encryption
  tags                          = local.common_tags
}

module "s3" {
  source = "./modules/s3"

  frontend_bucket_name = local.s3_bucket_names.frontend
  invoices_bucket_name = local.s3_bucket_names.invoices
  tags                 = local.common_tags
}

module "iam" {
  count  = var.manage_iam_role ? 1 : 0
  source = "./modules/iam"

  role_name = local.iam_role_name

  dynamodb_resource_arns = [
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.cart}",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.cart}/index/*",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.inventory}",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.inventory}/index/*",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.orders}",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.orders}/index/*",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.payments}",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.payments}/index/*",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.products}",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.products}/index/*",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.users}",
    "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.dynamodb_table_names.users}/index/*",
  ]

  s3_bucket_arns = [
    "arn:aws:s3:::${local.s3_bucket_names.frontend}",
    "arn:aws:s3:::${local.s3_bucket_names.invoices}",
  ]

  s3_object_arns = [
    "arn:aws:s3:::${local.s3_bucket_names.frontend}/*",
    "arn:aws:s3:::${local.s3_bucket_names.invoices}/*",
  ]

  queue_arn = local.order_queue_arn
  topic_arn = local.payment_topic_arn
  tags      = local.common_tags
}

locals {
  lambda_role_arn = var.manage_iam_role ? module.iam[0].role_arn : data.aws_iam_role.existing_lambda_role[0].arn
}

module "cart_lambda" {
  source = "./modules/lambda"

  function_name = local.lambda_function_names.cart
  runtime       = var.default_lambda_runtime
  handler       = "cart.handler"
  timeout       = var.default_lambda_timeout
  memory_size   = var.default_lambda_memory_size
  filename      = var.cart_lambda_package
  role_arn      = local.lambda_role_arn
  tags          = local.common_tags

  environment_variables = {
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = module.dynamodb.cart_table_name
    CART_TABLE          = module.dynamodb.cart_table_name
    PRODUCT_TABLE       = module.dynamodb.products_table_name
    INVENTORY_TABLE     = module.dynamodb.inventory_table_name
    ORDER_TABLE         = module.dynamodb.orders_table_name
    PAYMENT_TABLE       = module.dynamodb.payments_table_name
    USER_TABLE          = module.dynamodb.users_table_name
  }
}

module "products_lambda" {
  source = "./modules/lambda"

  function_name = local.lambda_function_names.products
  runtime       = var.default_lambda_runtime
  handler       = "products.handler"
  timeout       = var.default_lambda_timeout
  memory_size   = var.default_lambda_memory_size
  filename      = var.products_lambda_package
  role_arn      = local.lambda_role_arn
  tags          = local.common_tags

  environment_variables = {
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = module.dynamodb.products_table_name
  }
}

module "inventory_lambda" {
  source = "./modules/lambda"

  function_name = local.lambda_function_names.inventory
  runtime       = var.default_lambda_runtime
  handler       = "inventory.handler"
  timeout       = var.default_lambda_timeout
  memory_size   = var.default_lambda_memory_size
  filename      = var.inventory_lambda_package
  role_arn      = local.lambda_role_arn
  tags          = local.common_tags

  environment_variables = {
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = module.dynamodb.inventory_table_name
    INVENTORY_TABLE     = module.dynamodb.inventory_table_name
    PRODUCT_TABLE       = module.dynamodb.products_table_name
  }
}

module "payment_lambda" {
  source = "./modules/lambda"

  function_name = local.lambda_function_names.payment
  runtime       = var.default_lambda_runtime
  handler       = "payments.handler"
  timeout       = var.default_lambda_timeout
  memory_size   = var.default_lambda_memory_size
  filename      = var.payment_lambda_package
  role_arn      = local.lambda_role_arn
  tags          = local.common_tags

  environment_variables = {
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = module.dynamodb.payments_table_name
    PAYMENT_TABLE       = module.dynamodb.payments_table_name
    ORDER_TABLE         = module.dynamodb.orders_table_name
    PAYMENT_TOPIC_ARN   = local.payment_topic_arn
  }
}

module "order_lambda" {
  source = "./modules/lambda"

  function_name = local.lambda_function_names.order
  runtime       = var.default_lambda_runtime
  handler       = "orders.handler"
  timeout       = var.default_lambda_timeout
  memory_size   = var.default_lambda_memory_size
  filename      = var.order_lambda_package
  role_arn      = local.lambda_role_arn
  tags          = local.common_tags

  environment_variables = {
    AWS_REGION          = var.aws_region
    DYNAMODB_TABLE_NAME = module.dynamodb.orders_table_name
    ORDER_TABLE         = module.dynamodb.orders_table_name
    CART_TABLE          = module.dynamodb.cart_table_name
    PRODUCT_TABLE       = module.dynamodb.products_table_name
    ORDER_QUEUE_URL     = local.order_queue_url
  }
}

module "notification_lambda" {
  source = "./modules/lambda"

  function_name = local.lambda_function_names.notification
  runtime       = var.default_lambda_runtime
  handler       = "index.handler"
  timeout       = var.default_lambda_timeout
  memory_size   = var.default_lambda_memory_size
  filename      = var.notification_lambda_package
  role_arn      = local.lambda_role_arn
  tags          = local.common_tags

  environment_variables = {
    AWS_REGION     = var.aws_region
    INVOICE_BUCKET = module.s3.invoices_bucket_name
  }
}

module "api_gateway" {
  source = "./modules/api_gateway"

  api_name   = local.api_name
  stage_name = var.api_stage_name
  aws_region = var.aws_region
  tags       = local.common_tags

  cart_lambda_name            = module.cart_lambda.function_name
  cart_lambda_invoke_arn      = module.cart_lambda.invoke_arn
  products_lambda_name        = module.products_lambda.function_name
  products_lambda_invoke_arn  = module.products_lambda.invoke_arn
  inventory_lambda_name       = module.inventory_lambda.function_name
  inventory_lambda_invoke_arn = module.inventory_lambda.invoke_arn
  payment_lambda_name         = module.payment_lambda.function_name
  payment_lambda_invoke_arn   = module.payment_lambda.invoke_arn
  order_lambda_name           = module.order_lambda.function_name
  order_lambda_invoke_arn     = module.order_lambda.invoke_arn
}

module "sqs" {
  count  = var.manage_sqs ? 1 : 0
  source = "./modules/sqs"

  queue_name           = local.order_queue_name
  inventory_lambda_arn = module.inventory_lambda.function_arn
  tags                 = local.common_tags
}

module "sns" {
  count  = var.manage_sns ? 1 : 0
  source = "./modules/sns"

  topic_name               = local.payment_topic_name
  notification_lambda_arn  = module.notification_lambda.function_arn
  notification_lambda_name = module.notification_lambda.function_name
  tags                     = local.common_tags
}
