export { AppRoutes } from "./AppRoutes"; // Exporta el árbol principal de rutas de la app
export { RequireAuth, RequireAdmin } from "./routeGuards"; // Exporta guards para proteger rutas privadas y de admin
export * from "./routeElements"; // Exporta wrappers de elementos para mantener AppRoutes limpio
