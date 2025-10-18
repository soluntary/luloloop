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
  const supabase = await createServerClient()

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

export async function registerForInstance(instanceId: string, message?: string) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "User not authenticated" }
  }

  try {
    const { data: instance, error: instanceError } = await supabase
      .from("ludo_event_instances")
      .select("event_id")
      .eq("id", instanceId)
      .single()

    if (instanceError || !instance) {
      console.error("Error fetching instance:", instanceError)
      return { success: false, error: "Instance not found" }
    }

    const { data: event, error: eventError } = await supabase
      .from("ludo_events")
      .select("approval_mode")
      .eq("id", instance.event_id)
      .single()

    if (eventError || !event) {
      console.error("Error fetching event:", eventError)
      return { success: false, error: "Event not found" }
    }

    const approvalMode = event.approval_mode || "automatic"

    if (approvalMode === "manual") {
      // Check if join request already exists for this event
      const { data: existingRequest } = await supabase
        .from("ludo_event_join_requests")
        .select("id")
        .eq("event_id", instance.event_id)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single()

      // Only create join request if one doesn't exist
      if (!existingRequest) {
        const { error: requestError } = await supabase.from("ludo_event_join_requests").insert({
          event_id: instance.event_id,
          user_id: user.id,
          message: message || null,
          status: "pending",
        })

        if (requestError) {
          console.error("Error creating join request:", requestError)
          return { success: false, error: requestError.message }
        }
      }

      // Add to participants with pending status
      const { error } = await supabase.from("ludo_event_instance_participants").insert({
        instance_id: instanceId,
        user_id: user.id,
        status: "pending",
      })

      if (error) {
        console.error("Error registering for instance:", error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await supabase.from("ludo_event_instance_participants").insert({
        instance_id: instanceId,
        user_id: user.id,
        status: "registered",
      })

      if (error) {
        console.error("Error registering for instance:", error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath("/ludo-events")
    return { success: true }
  } catch (error: any) {
    console.error("Error in registerForInstance:", error)
    return { success: false, error: error.message }
  }
}

export async function unregisterFromInstance(instanceId: string) {
  const supabase = await createServerClient()

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
  const supabase = await createServerClient()

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
