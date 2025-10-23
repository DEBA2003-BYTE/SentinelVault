import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

export const s3 = new AWS.S3();

export const uploadToS3 = async (
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<AWS.S3.ManagedUpload.SendData> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'cloud-storage-bucket',
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ServerSideEncryption: 'AES256'
  };

  return s3.upload(params).promise();
};

export const downloadFromS3 = async (key: string): Promise<AWS.S3.GetObjectOutput> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'cloud-storage-bucket',
    Key: key
  };

  return s3.getObject(params).promise();
};

export const deleteFromS3 = async (key: string): Promise<AWS.S3.DeleteObjectOutput> => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'cloud-storage-bucket',
    Key: key
  };

  return s3.deleteObject(params).promise();
};

export const generatePresignedUrl = (key: string, expires: number = 3600): string => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || 'cloud-storage-bucket',
    Key: key,
    Expires: expires
  };

  return s3.getSignedUrl('getObject', params);
};