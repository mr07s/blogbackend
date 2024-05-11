import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("*", async (c, next) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const header = c.req.header("authorization") || "";

  const secret = c.env.JWT_SECRET;
  const token = header.split(" ")[1];
  console.log(token);
  if (!token) {
    return c.json({ message: "Token undefined" });
  }
  const response = await verify(token, secret);
  const user = await prisma.user.findUnique({
    where: {
      id: response.id,
    },
  });
  if (!user) {
    c.status(403);
    c.json({ message: "Forbidden" });
  }
  c.set("userId", response.id);
  await next();
});

blogRouter.post("/postblog", async (c) => {
  console.log("Reached heare");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const data = await c.req.json();
  const id = c.get("userId");

  console.log(id);

  const res = await prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      published: data.published,
      authorId: id,
    },
  });
  return c.json({ message: res });
});
