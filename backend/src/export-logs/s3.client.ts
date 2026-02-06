import { S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";

export function createS3Client(config: ConfigService) {
  return new S3Client({
    region: config.get<string>("AWS_REGION"),
    credentials: {
      accessKeyId: config.get<string>("AWS_ACCESS_KEY_ID"),
      secretAccessKey: config.get<string>("AWS_SECRET_ACCESS_KEY"),
    },
  });
}
