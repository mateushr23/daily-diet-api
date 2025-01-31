import { FastifyInstance } from "fastify"
import { z } from "zod"
import { knex } from "../database"
import crypto from "node:crypto"

export async function usersRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const users = await knex("users").select()

    return { users }
  })

  app.get("/:id", async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionParamsSchema.parse(request.params)

    const user = await knex("users").where("id", id).first()

    return { user }
  })

  app.post("/", async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    const { name, email } = createUserBodySchema.parse(request.body)

    await knex("users").insert({
      id: crypto.randomUUID(),
      name,
      email,
    })

    return reply.status(201).send()
  })
}
