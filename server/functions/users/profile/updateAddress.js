import { requireAuth } from "../../../utils/auth.js";
import { parseBody } from "../../../utils/validators.js";
import { success, badRequest, serverError } from "../../../utils/responses.js";
import { userService } from "../../../services/user.service.js";

const updateAddressHandler = async (event) => {
  try {
    const user = event.user;
    const body = parseBody(event);
    const {
      default_country,
      default_address,
      default_address2,
      default_city,
      default_state,
      default_zip,
      default_phone,
    } = body;

    // Delegar al servicio
    const updatedUser = await userService.updateAddress(user.id, {
      default_country,
      default_address,
      default_address2,
      default_city,
      default_state,
      default_zip,
      default_phone,
    });

    return success({
      success: true,
      message: "Dirección actualizada exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error en updateAddress:", error);

    if (error.message === "Body inválido") {
      return badRequest(error.message);
    }

    if (error.name === "ValidationError") {
      return badRequest(error.message);
    }

    return serverError("Error al actualizar dirección");
  }
};

export const updateAddress = requireAuth(updateAddressHandler);
