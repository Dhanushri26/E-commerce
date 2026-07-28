import boto3
from fastmcp import FastMCP

# 1. Initialize FastMCP
mcp = FastMCP("AWS S3 Demo Server")

# 2. Define the tool function
@mcp.tool()
def list_s3_buckets() -> list:
    """Lists all S3 bucket names in the configured AWS account."""
    s3 = boto3.client('s3')
    response = s3.list_buckets()
    return [bucket['Name'] for bucket in response.get('Buckets', [])]

if __name__ == "__main__":
    mcp.run()