# Root module orchestrating all ShopSphere AWS resources

module "cognito" {
  source      = "./modules/cognito"
  app_name    = var.app_name
  environment = var.environment
}

module "dynamodb" {
  source      = "./modules/dynamodb"
  app_name    = var.app_name
  environment = var.environment
}

module "messaging" {
  source      = "./modules/messaging"
  app_name    = var.app_name
  environment = var.environment
}

module "iam" {
  source      = "./modules/iam"
  app_name    = var.app_name
  environment = var.environment

  dynamodb_table_arns = [
    module.dynamodb.shared_table_arn,
    module.dynamodb.product_table_arn,
    module.dynamodb.cart_table_arn,
    module.dynamodb.order_table_arn,
    module.dynamodb.payment_table_arn,
    module.dynamodb.inventory_table_arn,
    module.dynamodb.user_table_arn
  ]

  order_queue_arn   = module.messaging.order_queue_arn
  payment_topic_arn = module.messaging.payment_topic_arn
}

module "lambda" {
  source      = "./modules/lambda"
  app_name    = var.app_name
  environment = var.environment
  aws_region  = var.aws_region

  lambda_role_arn      = module.iam.lambda_role_arn
  shared_table_name    = module.dynamodb.shared_table_name
  product_table_name   = module.dynamodb.product_table_name
  cart_table_name      = module.dynamodb.cart_table_name
  order_table_name     = module.dynamodb.order_table_name
  payment_table_name   = module.dynamodb.payment_table_name
  inventory_table_name = module.dynamodb.inventory_table_name
  user_table_name      = module.dynamodb.user_table_name

  order_queue_url   = module.messaging.order_queue_url
  payment_topic_arn = module.messaging.payment_topic_arn

  project_root_dir = "${path.module}/.."
}

module "api_gateway" {
  source      = "./modules/api_gateway"
  app_name    = var.app_name
  environment = var.environment
  aws_region  = var.aws_region

  cognito_user_pool_id = module.cognito.user_pool_id
  cognito_client_id    = module.cognito.client_id

  product_service_invoke_arn   = module.lambda.product_service_invoke_arn
  product_service_name         = module.lambda.product_service_name
  cart_service_invoke_arn      = module.lambda.cart_service_invoke_arn
  cart_service_name            = module.lambda.cart_service_name
  order_service_invoke_arn     = module.lambda.order_service_invoke_arn
  order_service_name           = module.lambda.order_service_name
  payment_service_invoke_arn   = module.lambda.payment_service_invoke_arn
  payment_service_name         = module.lambda.payment_service_name
  inventory_service_invoke_arn = module.lambda.inventory_service_invoke_arn
  inventory_service_name       = module.lambda.inventory_service_name
}

module "frontend_s3" {
  source      = "./modules/frontend_s3"
  app_name    = var.app_name
  environment = var.environment
}
