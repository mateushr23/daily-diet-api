import { FastifyReply, FastifyRequest } from "fastify"
import { knex } from "../database"

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const sessionId = request.cookies.sessionId

  if (!sessionId) {
    return reply.status(401).send({ error: "Unauthorized." })
  }

  const user = await knex("users").where({ session_id: sessionId }).first()

  if (!user) {
    return reply.status(401).send({ error: "Unauthorized" })
  }

  // 🔹 Garantindo que o TypeScript reconheça o tipo de user corretamente
  request.user = {
    id: user.id as string,
    session_id: user.session_id as string,
    name: user.name as string,
    email: user.email as string,
    created_at: user.created_at as string,
  }
}
