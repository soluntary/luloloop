// Test script to check user memberships directly
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const userId = "5792b81e-9d84-4fa2-aa61-9fbacb601118"

console.log("[v0] Testing user memberships for:", userId)

// Check if user exists
const { data: userData, error: userError } = await supabase
  .from("users")
  .select("id, name, email")
  .eq("id", userId)
  .single()

console.log("[v0] User data:", userData, userError)

// Check community_members table
const { data: memberships, error: membershipError } = await supabase
  .from("community_members")
  .select("*")
  .eq("user_id", userId)

console.log("[v0] User memberships:", memberships, membershipError)

// Check all community_members to see what's in the table
const { data: allMembers, error: allError } = await supabase.from("community_members").select("*").limit(10)

console.log("[v0] Sample community members:", allMembers, allError)

// Check if there are any communities this user could join
const { data: communities, error: communitiesError } = await supabase
  .from("communities")
  .select("id, name, creator_id")
  .limit(5)

console.log("[v0] Sample communities:", communities, communitiesError)
