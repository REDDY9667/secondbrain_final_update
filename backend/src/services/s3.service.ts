import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import fss from 'fs';
import path from 'path';

const s3 = new S3Client({
  region: 'ap-south-1',
});

class S3Service {

  async uploadFile(
    localPath: string,
    key: string,
    contentType: string
  ): Promise<string> {

    const fileStream = fss.createReadStream(localPath);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
      })
    );

    return key;
  }

  async downloadFile(key: string): Promise<string> {

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    });

    const response = await s3.send(command);

    const body = response.Body as any;

    const chunks: Buffer[] = [];

    for await (const chunk of body) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const localPath =
      `/tmp/${path.basename(key)}`;

    await fs.writeFile(localPath, buffer);

    return localPath;
  }

  async deleteFile(key: string): Promise<void> {

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
      })
    );
  }

}

export default new S3Service();