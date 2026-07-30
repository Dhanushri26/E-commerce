import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.AWS_REGION
});

export const handler = async (event) => {

    console.log("SNS Event Received");

    const snsMessage = JSON.parse(event.Records[0].Sns.Message);

    console.log(snsMessage);

    const invoice = `
=========================
JEWELCART INVOICE
=========================

Order ID : ${snsMessage.orderId}

Payment ID : ${snsMessage.paymentId}

Customer : ${snsMessage.customerId}

Amount : ${snsMessage.amount}

Status : PAID

Generated : ${new Date().toISOString()}
`;

    await s3.send(
        new PutObjectCommand({

            Bucket: process.env.INVOICE_BUCKET,

            Key: `${snsMessage.orderId}.txt`,

            Body: invoice,

            ContentType: "text/plain"

        })
    );

    console.log("Invoice uploaded to S3");

    return {
        statusCode: 200
    };

};