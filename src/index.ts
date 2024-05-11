import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { userRouter } from "./routes/users";
import { blogRouter } from "./routes/blogs";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    prisma: any;
  };
}>();
// app.use("*", async (c) => {
//   const prisma = new PrismaClient({
//     datasourceUrl: c.env.DATABASE_URL,
//   }).$extends(withAccelerate());
//   c.set("prisma", prisma);
// });

// app.use("/api/v1/*", async (c, next) => {
//   const prisma = new PrismaClient({
//     datasourceUrl: c.env.DATABASE_URL,
//   }).$extends(withAccelerate());

//   const header = c.req.header("authorization") || "";

//   const secret = c.env.JWT_SECRET;
//   const token = header.split(" ")[1];
//   console.log(token);
//   if (!token) {
//     return c.json({ message: "Token undefined" });
//   }
//   const response = await verify(token, secret);
//   const user = await prisma.user.findUnique({
//     where: {
//       id: response.id,
//     },
//   });
//   if (!user) {
//     c.status(403);
//     c.json({ message: "Forbidden" });
//   }
//   c.set("userId", response.id);
//   await next();
// });

app.route("/api/v1/user", userRouter);

app.route("/api/v1/blog", blogRouter);

app.put("/api/v1/blog", (c) => {
  return c.text("Hello Hono!");
});
app.get("/api/v1/blog/:id", (c) => {
  return c.text("Hello Hono!");
});

//      "postgresql://postgres1_owner:Tn4sNC1dDmXO@ep-dawn-pond-a5mxacc4.us-east-2.aws.neon.tech/postgres1?sslmode=require",
// DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMWM2Y2MwYjktOWI4MC00MmQ2LWJkOTctMDY2YTUyZTJkMDYzIiwidGVuYW50X2lkIjoiNWM1NmI0NWVhZTU3NzNmNmU0NTk3YTdmNzMyNzVkOGVkYjM1NDJmYzk5YmI3MGMwYTcxNmRiNDgzNzFmOWM5OCIsImludGVybmFsX3NlY3JldCI6IjZjZGVmODAyLWZiZjktNDRhNy1hZmVmLWYxMTU4MjEyODYzYSJ9.p0w_VSA97kpWPiuX4wDcLHyYK7lswbBOTNaazHYZX9Q"
export default app;
