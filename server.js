require("dotenv").config();

const express =
  require("express");

const cors =
  require("cors");

const OpenAI =
  require("openai");

const swaggerUi =
  require("swagger-ui-express");

const swaggerSpec =
  require("./swagger");

const rateLimit =
  require("express-rate-limit");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({
  limit: "2mb"
}));

// =====================================================
// RATE LIMIT
// =====================================================

const limiter =
  rateLimit({

    windowMs:
      60 * 1000,

    max: 30,

    message:
      "Too many requests"
  });

app.use(limiter);

// =====================================================
// OPENAI
// =====================================================

const client =
  new OpenAI({
    apiKey:
      process.env.OPENAI_API_KEY
  });

// =====================================================
// HEALTH
// =====================================================

app.get(
  "/linkedin-smart-feed/api/health",
  (req, res) => {

    res.json({
      status: "ok"
    });
  }
);

// =====================================================
// SWAGGER
// =====================================================

app.use(
  "/linkedin-smart-feed/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

/**
 * @swagger
 * /linkedin-smart-feed/api/analyze:
 *   post:
 *     summary:
 *       Analyze LinkedIn posts
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             properties:
 *               posts:
 *                 type: array
 *
 *                 items:
 *                   type: string
 *
 *                 example:
 *                   - "We are hiring frontend engineers"
 *                   - "I built an AI startup"
 *
 *     responses:
 *       200:
 *         description:
 *           Successful classification
 */

// =====================================================
// ANALYZE
// =====================================================

app.post(
  "/linkedin-smart-feed/api/analyze",
  async (req, res) => {

    try {

      const posts =
        req.body.posts || [];

      if (
        !Array.isArray(posts)
      ) {

        return res.status(400)
          .json({
            error:
              "posts must be array"
          });
      }

      const payload =
        posts.map((text, i) => `
POST ${i + 1}:
${text}
`).join("\n\n");

      const response =
        await client.chat.completions.create({

          model: "gpt-4.1-mini",

          messages: [
            {
              role: "system",

              content: `
You classify LinkedIn posts.

Return ONLY valid JSON.

Example:

{
  "1": "technical",
  "2": "founder"
}

Allowed labels:

technical
insightful
founder
hiring
motivational
achievement
politics
promotional
spam
neutral
`
            },

            {
              role: "user",
              content: payload
            }
          ],

          temperature: 0,

          response_format: {
            type: "json_object"
          }
        });

      const content =
        response.choices?.[0]
          ?.message?.content;

      res.json(
        JSON.parse(content)
      );

    } catch (e) {

      console.error(e);

      res.status(500).json({
        error:
          e.message
      });
    }
  }
);

// =====================================================
// START
// =====================================================

const PORT =
  process.env.PORT || 8000;

app.listen(PORT, () => {

  console.log(
    `Server running on ${PORT}`
  );
});