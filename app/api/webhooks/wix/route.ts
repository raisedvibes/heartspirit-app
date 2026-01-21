import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Secure: Use the server-side Supabase service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Extract the user and circle from the Wix payload. 
    // These depend on your Wix setup. Example fields:
    const userId = body.user_id; // The user's Supabase ID
    const circleId = body.circle_id; // The circle they paid for

    if (!userId || !circleId) {
      return NextResponse.json({ error: "Missing user or circle ID" }, { status: 400 });
    }

    // Insert into circle_memberships if not already joined
    const { data, error } = await supabase
      .from("circle_memberships")
      .upsert(
        { user_id: userId, circle_id: circleId },
        { onConflict: 'user_id,circle_id' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Membership updated", data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
