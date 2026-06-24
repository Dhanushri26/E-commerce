import { createErrorResponse } from "./shared.js";

export const handler = async () => createErrorResponse(404, "Route not found");
