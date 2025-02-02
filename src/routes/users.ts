import { FastifyInstance } from "fastify"
import { z } from "zod"
import { knex } from "../database"
import { randomUUID } from "node:crypto"

export async function usersRoutes(app: FastifyInstance) {
  //LISTAR USUARIOS
  app.get("/", async () => {
    const users = await knex("users").select()

    return { users }
  })
  //LISTAR USUARIO ESPECIFICO
  app.get("/:id", async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex("users").where("id", id).first()

    return { user }
  })
  //CRIAR USUARIO
  app.post("/", async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, //7 days
      })
    }

    const { name, email } = createUserBodySchema.parse(request.body)

    await knex("users").insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
