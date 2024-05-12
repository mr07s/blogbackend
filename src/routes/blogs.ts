import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { createBlogInput, updateBlogInput } from "@soumyadeep/medium-common";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();
// --------------------------Middle ware------------------
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
// -------------------postblog-----------------------
blogRouter.post("/", async (c) => {
  // console.log("Reached heare");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const data = await c.req.json();
    const id = c.get("userId");

    const { success } = createBlogInput.safeParse(data);
    console.log(success);
    if (!success) {
      c.status(411);
      return c.json({ message: "Invalid input" });
    }
    const res = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        published: data.published,
        authorId: id,
      },
    });
    return c.json({ message: res });
  } catch (e) {
    c.status(500);
    return c.json({ e });
  }
});

// ------------------------------updateblogs------------------------------
blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId");
  const body = await c.req.json();
  const { success } = updateBlogInput.safeParse(body);

  if (!success) {
    c.status(411);
    return c.json({ message: "Invalid input" });
  }
  const res = prisma.post.update({
    where: {
      id: body.id,
      authorId: userId,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });
  return c.json({ mesage: "Updated Successfully" });
});
// -------------------------Get all blogs--------------------------
blogRouter.get("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.post.findMany({});
  c.status(200);
  return c.json({ blogs });
});
// ------------------------------Get a specific blog---------------------------
blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const blogId = c.req.param("id");
  const blog = await prisma.post.findUnique({
    where: {
      id: blogId,
    },
  });
  if (!blog) {
    c.status(404);
    return c.json({ meassage: "Blog not found" });
  }
  return c.json(blog);
});
