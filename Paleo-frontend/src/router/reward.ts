import { Router } from "express";
import prisma from "../prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { userId, coins } = req.body;

    if (!userId || !coins) {
      return res.status(400).json({
        error: "Dados inválidos"
      });
    }

    // 🔥 soma moedas no banco
    const updatedUser = await prisma.user.update({
      where: {
        id: userId
      },

      data: {
        coins: {
          increment: coins
        }
      }
    });

    return res.json(updatedUser);

  } catch (err) {
    console.error("Erro reward:", err);

    return res.status(500).json({
      error: "Erro interno"
    });
  }
});

export default router;