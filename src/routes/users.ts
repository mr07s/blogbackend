import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { SigninInput } from "@soumyadeep/medium-common";
import { SignupInput } from "@soumyadeep/medium-common";
export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

// -------------------------------------------------------------------------------------------------
userRouter.post("/signup", async (c) => {
  console.log("first");
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  let body = await c.req.json();
  console.log(body);
  body = body.postInput;
  console.log(body);
  const { success } = SignupInput.safeParse(body);
  console.log(success);
  if (!success) {
    c.status(403);
    return c.json({ meassage: "Invalid input" });
  }
  const alreadyExist = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (alreadyExist) {
    c.status(403);
    return c.json({ message: "User already exist" });
  }

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: body.password,
      name: body.name,
    },
  });
  const secret = c.env.JWT_SECRET;
  const token = await sign({ id: user.id }, secret);

  return c.json({ token });
});

// ---------------------------------------------------------------------------------------------------
userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();

  const { success } = SigninInput.safeParse(body);
  console.log(success);
  if (!success) {
    c.status(403);
    return c.json({ meassage: "Invalid input" });
  }

  const userdata = await prisma.user.findUnique({
    where: {
      email: body.email,
      password: body.password,
    },
  });

  console.log(userdata);
  if (!userdata) {
    c.status(404);
    return c.json({ error: "User not found" });
  }

  const secret = c.env.JWT_SECRET;

  const jwt = await sign({ id: userdata?.id }, secret);
  return c.json({ jwt });
});
