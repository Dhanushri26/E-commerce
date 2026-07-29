# 🏗 ShopSphere — Terraform Infrastructure as Code (IaC)

This directory contains the modular **Terraform** configuration for provisioning the complete serverless architecture for the **ShopSphere E-Commerce Platform** on AWS.

---

## 📐 Architecture & Components

The Terraform configuration is organized into 7 clean modules:

| Module | Location | Description |
|---|---|---|
| **Cognito** | [`modules/cognito`](./modules/cognito) | User Pool, App Client (OAuth/JWT), and User Groups (`Admin`, `Business`) |
| **DynamoDB** | [`modules/dynamodb`](./modules/dynamodb) | 7 tables (`shared`, `product`, `cart`, `order`, `payment`, `inventory`, `user`) with Pay-Per-Request billing & Point-in-time recovery |
| **Messaging** | [`modules/messaging`](./modules/messaging) | SQS Order Queue + Dead-Letter Queue (DLQ) & SNS Payment Topic |
| **IAM** | [`modules/iam`](./modules/iam) | Least-privilege IAM Roles and Policies for Lambda microservices |
| **Lambda** | [`modules/lambda`](./modules/lambda) | Packaging (`.zip`) & deployment of 5 Node.js 20.x Lambda functions with auto-wired env vars |
| **API Gateway** | [`modules/api_gateway`](./modules/api_gateway) | AWS HTTP API v2 with Cognito JWT Authorizer, CORS, routes & Lambda integrations |
| **Frontend S3** | [`modules/frontend_s3`](./modules/frontend_s3) | S3 Bucket + CloudFront Distribution with Origin Access Control (OAC) for React SPA hosting |

---

## 🛠 Prerequisites

1. **Terraform CLI**: Installed (`>= 1.5.0`). Check version via `terraform --version`.
2. **AWS CLI**: Configured with appropriate AWS IAM permissions (`aws configure` or environment credentials).
3. **Node.js + npm**: Required locally because Terraform packages the Lambda services from `services/` during normal execution.

---

## 🚀 Quick Start Guide

### 1. Change to the Terraform directory
```bash
cd terraform
```

### 2. Copy the sample variables file
```bash
cp terraform.tfvars.example terraform.tfvars
```
*(Optionally edit `terraform.tfvars` to customize your AWS region or environment name).*

### 3. Install Lambda service dependencies
Terraform packages the service directories as ZIPs, so install each service's dependencies before planning or applying:
```bash
cd ../services/product-service && npm ci
cd ../cart-service && npm ci
cd ../order-service && npm ci
cd ../payment-service && npm ci
cd ../inventory-service && npm ci
cd ../../terraform
```

### 4. Initialize Terraform
Initializes modules, providers (`hashicorp/aws`, `hashicorp/archive`, `hashicorp/random`), and backend state.
```bash
terraform init
```

### 5. Format & Validate HCL Code
```bash
terraform fmt -recursive
terraform validate
```

### 6. Plan Infrastructure Deployment
Generates an execution plan to preview all resources that will be created.
```bash
terraform plan
```

### 7. Apply & Provision AWS Resources
Applies the infrastructure configuration to AWS.
```bash
terraform apply
```
*Type `yes` when prompted to confirm deployment.*

---

## 📤 Outputs

After `terraform apply` completes successfully, key outputs will be displayed:

```text
api_gateway_url             = "https://<api-id>.execute-api.ap-southeast-1.amazonaws.com"
cognito_user_pool_id        = "ap-southeast-1_xxxxx"
cognito_user_pool_client_id = "xxxxxxxxxxxxxxxxxxxx"
frontend_cloudfront_url     = "https://d111111abcdef8.cloudfront.net"
frontend_s3_bucket          = "shopsphere-dev-frontend-a1b2c3d4"
sns_payment_topic_arn       = "arn:aws:sns:ap-southeast-1:123456789012:shopsphere-dev-payment-topic"
sqs_order_queue_url         = "https://sqs.ap-southeast-1.amazonaws.com/123456789012/shopsphere-dev-order-queue"
```

---

## 🌐 Updating Frontend Config with Terraform Outputs

After running `terraform apply`, update your frontend configuration (`frontend/src/amplifyConfig.js` and `frontend/vite.config.ts`) with the generated outputs:

```javascript
// frontend/src/amplifyConfig.js
export const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: "<cognito_user_pool_id>",
      userPoolClientId: "<cognito_user_pool_client_id>",
    }
  }
};
```

---

## 🧹 Cleanup / Teardown

To destroy all created AWS resources and prevent incurring costs:

```bash
terraform destroy
```
*Type `yes` when prompted to confirm destruction.*
