"use server"

import { createServerClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function createPollWithOptions(data: {
  communityId: string
  question: string
  allowMultipleChoices: boolean
  options: string[]
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)

  console.log("[v0] SERVER ACTION: Creating poll with options", {
    communityId: data.communityId,
    question: data.question,
    optionsCount: data.options.length,
    options: data.options,
  })

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("[v0] SERVER ACTION: Auth error", userError)
    throw new Error("Nicht authentifiziert")
  }

  console.log("[v0] SERVER ACTION: User authenticated", user.id)

  // Create poll
  const { data: poll, error: pollError } = await supabase
    .from("community_polls")
    .insert({
      community_id: data.communityId,
      creator_id: user.id,
      question: data.question,
      allow_multiple_choices: data.allowMultipleChoices,
      status: "active",
    })
    .select()
    .single()

  if (pollError) {
    console.error("[v0] SERVER ACTION: Poll creation error", pollError)
    throw new Error(`Fehler beim Erstellen der Abstimmung: ${pollError.message}`)
  }

  console.log("[v0] SERVER ACTION: Poll created", poll.id)

  const optionsData = data.options.map((option) => ({
    poll_id: poll.id,
    option_text: option,
    votes_count: 0,
  }))

  console.log("[v0] SERVER ACTION: Inserting options", optionsData)

  const { data: insertedOptions, error: optionsError } = await supabase
    .from("community_poll_options")
    .insert(optionsData)
    .select()

  if (optionsError) {
    console.error("[v0] SERVER ACTION: Options insertion error", {
      error: optionsError,
      message: optionsError.message,
      details: optionsError.details,
      hint: optionsError.hint,
      code: optionsError.code,
    })

    // Rollback: Delete the poll
    await supabase.from("community_polls").delete().eq("id", poll.id)

    throw new Error(`Fehler beim Erstellen der Optionen: ${optionsError.message}`)
  }

  console.log("[v0] SERVER ACTION: Options inserted successfully", {
    count: insertedOptions.length,
    options: insertedOptions,
  })

  return {
    success: true,
    pollId: poll.id,
    optionsCount: insertedOptions.length,
  }
}
