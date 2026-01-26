import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import config from "../config.js";

const s3Client = new S3Client({ region: config.AWS_REGION });
const BUCKET_NAME = config.S3_BUCKET;

/**
 * Sube un archivo a S3
 * @param {Buffer} buffer - Buffer del archivo
 * @param {string} key - Ruta del archivo en S3
 * @param {string} contentType - Tipo de contenido
 * @returns {Promise<string>} URL pública del archivo
 */
export const uploadToS3 = async (buffer, key, contentType = "image/jpeg") => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return `https://${BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${key}`;
};

/**
 * Elimina un archivo de S3
 * @param {string} key - Ruta del archivo en S3
 */
export const deleteFromS3 = async (key) => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }),
  );
};

/**
 * Extrae la key de S3 desde una URL
 * @param {string} url - URL completa de S3
 * @returns {string|null} Key del archivo o null
 */
export const getS3KeyFromUrl = (url) => {
  if (!url) return null;

  const match = url.match(/\.amazonaws\.com\/(.+)$/);
  return match ? match[1] : null;
};
