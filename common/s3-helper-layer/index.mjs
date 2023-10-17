import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

 const s3fileUploader = async (bucket, fileName, body) => {
  const client = new S3Client({});
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: body,
  });

  try {
    const response = await client.send(command);
    console.log(response);
  } catch (err) {
    console.error(err);
  }
};

export default s3fileUploader;