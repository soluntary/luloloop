"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface LudoEventInstance {
  id: string
  event_id: string
  instance_date: string
  start_time?: string
  end_time?: string
  max_participants?: number
  status: string
  notes?: string
  participant_count?: number
  user_registered?: boolean
}

export async function getEventInstances(eventId: string): Promise<LudoEventInstance[]> {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get instances with participant count
  const { data: instances, error } = await supabase
    .from("ludo_event_instances")
    .select(`
      *,
      participant_count:ludo_event_instance_participants(count)
    `)
    .eq("event_id", eventId)
    .order("instance_date", { ascending: true })

  if (error) {
    console.error("Error fetching event instances:", error)
    return []
  }

  // If user is authenticated, check registration status for each instance
  let instancesWithRegistration = instances || []
  if (user && instances) {
    const { data: userRegistrations } = await supabase
      .from("ludo_event_instance_participants")
      .select("instance_id")
      .eq("user_id", user.id)
      .in(
        "instance_id",
        instances.map((i) => i.id),
      )

    const registeredInstanceIds = new Set(userRegistrations?.map((r) => r.instance_id) || [])

    instancesWithRegistration = instances.map((instance) => ({
      ...instance,
      participant_count: instance.participant_count?.[0]?.count || 0,
      user_registered: registeredInstanceIds.has(instance.id),
    }))
  } else {
    instancesWithRegistration = instances.map((instance) => ({
      ...instance,
      participant_count: instance.participant_count?.[0]?.count || 0,
      user_registered: false,
    }))
  }

  return instancesWithRegistration
}

export async function registerForInstance(instanceId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase.from("ludo_event_instance_participants").insert({
    instance_id: instanceId,
    user_id: user.id,
    status: "registered",
  })

  if (error) {
    throw new Error(`Error registering for instance: ${error.message}`)
  }

  revalidatePath("/ludo-events")
}

export async function unregisterFromInstance(instanceId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const { error } = await supabase
    .from("ludo_event_instance_participants")
    .delete()
    .eq("instance_id", instanceId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(`Error unregistering from instance: ${error.message}`)
  }

  revalidatePath("/ludo-events")
}

export async function createEventInstances(eventId: string, instances: Omit<LudoEventInstance, "id" | "event_id">[]) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("User not authenticated")
  }

  const instancesWithEventId = instances.map((instance) => ({
    ...instance,
    event_id: eventId,
  }))

  const { error } = await supabase.from("ludo_event_instances").insert(instancesWithEventId)

  if (error) {
    throw new Error(`Error creating event instances: ${error.message}`)
  }

  revalidatePath("/ludo-events")
}
