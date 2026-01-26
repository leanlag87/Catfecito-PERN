import Busboy from "busboy";

/**
 * Parsea multipart/form-data de API Gateway
 * @param {Object} event - Evento de API Gateway
 * @returns {Promise<{fields: Object, files: Array}>}
 */
export const parseMultipartFormData = (event) => {
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
