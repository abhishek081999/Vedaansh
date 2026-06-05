import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import type { IChart } from '@/lib/db/models/Chart'
import mongoose, { type Types } from 'mongoose'
import { regexFromSearch } from '@/lib/security/sanitize'

/** Mongoose filter type (FilterQuery is not re-exported; derive from sanitizeFilter). */
type ChartFilter = Parameters<typeof mongoose.sanitizeFilter<IChart>>[0]

export async function buildChartSearchFilter(search: string): Promise<ChartFilter> {
  const regex = regexFromSearch(search)
  if (!regex) return {}

  await connectDB()
  const matchingUsers = await User.find({
    $or: [{ name: regex }, { email: regex }],
  }).select('_id').lean<Array<{ _id: Types.ObjectId }>>()

  const orConditions: ChartFilter[] = [
    { name: regex },
    { birthPlace: regex },
  ]

  if (matchingUsers.length > 0) {
    orConditions.push({ userId: { $in: matchingUsers.map((u) => u._id) } })
  }

  return { $or: orConditions }
}
