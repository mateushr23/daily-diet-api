import "@fastify/jwt"
import "fastify"

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string
      session_id: string
      name: string
      email: string
      created_at: string
    }
  }
}
