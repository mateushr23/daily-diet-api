import { FastifyInstance } from "fastify"
import { z } from "zod"
import { knex } from "../database"
import { randomUUID } from "node:crypto"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"

export async function mealsRoutes(app: FastifyInstance) {
  //LISTAR REFEICOES
  app.get(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex("meals").where({ user_id: request.user?.id })

      return { meals }
    }
  )
  //LISTAR UMA UNICA REFEICAO
  app.get("/:id", { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealParamsSchema.parse(request.params)

    const meal = await knex("meals").where("id", id).first()

    return { meal }
  })
  //RESUMO DAS REFEICOES DO USUARIO
  app.get(
    "/summary",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      // 1. Quantidade total de refeições registradas
      const totalMeals = await knex("meals")
        .where({ user_id: request.user?.id })
        .count("* as total")
        .first()

      // 2. Quantidade total de refeições dentro da dieta
      const totalInDiet = await knex("meals")
        .where({ user_id: request.user?.id, inOrOut: "in" })
        .count("* as total")
        .first()

      // 3. Quantidade total de refeições fora da dieta
      const totalOutDiet = await knex("meals")
        .where({ user_id: request.user?.id, inOrOut: "out" })
        .count("* as total")
        .first()

      // 4. Melhor sequência de refeições dentro da dieta
      const meals = await knex("meals")
        .select("dateTime", "inOrOut")
        .where({ user_id: request.user?.id })
        .orderBy("dateTime", "asc")

      let currentSequence = 0
      let bestSequence = 0

      for (const meal of meals) {
        if (meal.inOrOut === "in") {
          currentSequence++
          if (currentSequence > bestSequence) {
            bestSequence = currentSequence
          }
        } else {
          currentSequence = 0
        }
      }

      return {
        totalMeals: totalMeals?.total || 0,
        totalInDiet: totalInDiet?.total || 0,
        totalOutDiet: totalOutDiet?.total || 0,
        bestSequence,
      }
    }
  )
  //CRIAR REFEICAO
  app.post(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        dateTime: z.string(),
        inOrOut: z.string().transform((value) => value.toLocaleLowerCase()),
      })

      const { name, description, dateTime, inOrOut } =
        createMealBodySchema.parse(request.body)

      await knex("meals").insert({
        id: randomUUID(),
        name,
        description,
        dateTime,
        inOrOut,
        user_id: request.user?.id,
      })

      return reply.status(201).send()
    }
  )
  //ATUALIZAR REFEICAO
  app.patch(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        dateTime: z.string().optional(),
        inOrOut: z
          .string()
          .transform((value) => value.toLocaleLowerCase())
          .optional(),
      })

      const { id } = updateMealParamsSchema.parse(request.params)
      const { name, description, dateTime, inOrOut } =
        updateMealBodySchema.parse(request.body)

      const meal = await knex("meals").where({ id }).first()

      if (!meal) {
        return reply.status(404).send({ message: "Meal not found" })
      }

      await knex("meals")
        .where({ id })
        .update({
          name: name ?? meal.name,
          description: description ?? meal.description,
          dateTime: dateTime ?? meal.dateTime,
          inOrOut: inOrOut ?? meal.inOrOut,
        })

      return reply.status(204).send()
    }
  )
  //DELETAR REFEICAO
  app.delete(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = deleteMealParamsSchema.parse(request.params)

      const meal = await knex("meals").where({ id }).first()

      if (!meal) {
        return reply.status(404).send({ message: "Meal not found" })
      }

      await knex("meals").where({ id }).delete()

      return reply.status(204).send()
    }
  )
}
