import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Load environment variables
const S3_BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION!;
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

// ✅ Initialize S3 Client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// ✅ Upload File to S3 Without ACL
const uploadToS3 = async (file: File, fileName: string): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadParams = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: file.type, // ✅ File type is preserved
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    // ✅ Generate file URL
    return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    throw new Error("Failed to upload file");
  }
};

export { uploadToS3 };
