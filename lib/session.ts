import { cookies } from "next/headers"
import { randomUUID } from "crypto"

const COOKIE_NAME = "tn_session"
const ONE_YEAR = 60 * 60 * 24 * 365

export async function getOrCreateSessionId() {
  const jar = await cookies()
  let sid = jar.get(COOKIE_NAME)?.value
  if (!sid) {
    sid = randomUUID()
    jar.set({
      name: COOKIE_NAME,
      value: sid,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    })
  }
  return sid
}
