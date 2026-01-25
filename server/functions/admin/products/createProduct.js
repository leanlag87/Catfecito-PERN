import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Busboy from "busboy";
import { docClient, TABLE_NAME, getTimestamp } from "../../../dynamodb.js";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import config from "../../../config.js";
import { requireAdmin } from "../../../utils/auth.js";
import {
  success,
  badRequest,
  notFound,
  serverError,
} from "../../../utils/responses.js";

const s3Client = new S3Client({ region: config.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET;

// Función helper para parsear multipart/form-data
const parseMultipartFormData = (event) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: {
        "content-type":
          event.headers["content-type"] || event.headers["Content-Type"],
      },
    });

    const fields = {};
    const files = [];

    busboy.on("file", (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];

      file.on("data", (data) => {
        chunks.push(data);
      });

      file.on("end", () => {
        files.push({
          fieldname,
          filename,
          encoding,
          mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("field", (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on("finish", () => {
      resolve({ fields, files });
    });

    busboy.on("error", (error) => {
      reject(error);
    });

    // Decodificar base64 si es necesario
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : event.body;

    busboy.write(body);
    busboy.end();
  });
};

const createProductHandler = async (event) => {
  try {
    // Parsear multipart form data
    const { fields, files } = await parseMultipartFormData(event);
    const { name, description, price, stock, category_id } = fields;

    console.log("📝 Fields received:", fields);
    console.log("📎 Files received:", files.length);

    // Validaciones
    if (!name || !description || !price || !category_id) {
      return badRequest(
        "Nombre, descripción, precio y categoría son requeridos",
      );
    }

    if (parseFloat(price) < 0) {
      return badRequest("El precio debe ser positivo");
    }

    if (stock && parseInt(stock) < 0) {
      return badRequest("El stock debe ser positivo");
    }

    // Verificar que la categoría existe
    const categoryResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CATEGORY#${category_id}`,
          SK: "METADATA",
        },
      }),
    );

    if (!categoryResult.Item) {
      return notFound("Categoría no encontrada");
    }

    const productId = uuidv4();
    let image_url = null;

    // Procesar imagen si está presente
    if (files.length > 0) {
      const imageFile = files[0];
      console.log("📷 Processing image:", imageFile.filename);

      try {
        const imageKey = `products/${productId}/${imageFile.filename}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: imageFile.buffer,
            ContentType: imageFile.mimeType,
            ACL: "public-read",
          }),
        );

        image_url = `https://${BUCKET_NAME}.s3.${config.AWS_REGION}.amazonaws.com/${imageKey}`;
        console.log("✅ Image uploaded to S3:", image_url);
      } catch (uploadError) {
        console.error("❌ Error uploading image to S3:", uploadError);
        return serverError("Error al subir la imagen");
      }
    }

    // Crear producto en DynamoDB
    const product = {
      PK: `PRODUCT#${productId}`,
      SK: "METADATA",
      GSI1PK: `CATEGORY#${category_id}`,
      GSI1SK: `PRODUCT#${productId}`,
      entityType: "PRODUCT",
      id: productId,
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      category_id,
      image_url,
      is_active: true,
      created_at: getTimestamp(),
      updated_at: getTimestamp(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: product,
      }),
    );

    console.log("✅ Product created successfully:", productId);

    return success(
      {
        success: true,
        message: "Producto creado exitosamente",
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          category_id: product.category_id,
          image_url: product.image_url,
          is_active: product.is_active,
          created_at: product.created_at,
          updated_at: product.updated_at,
        },
      },
      201,
    );
  } catch (error) {
    console.error("❌ Error en createProduct:", error);
    return serverError("Error al crear producto");
  }
};

export const createProduct = requireAdmin(createProductHandler);
