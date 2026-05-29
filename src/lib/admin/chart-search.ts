import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import type { FilterQuery } from 'mongoose'
import type { IChart } from '@/lib/db/models/Chart'

export async function buildChartSearchFilter(search: string): Promise<FilterQuery<IChart>> {
  if (!search.trim()) return {}

  await connectDB()
  const regex = { $regex: search.trim(), $options: 'i' }
  const matchingUsers = await User.find({
    $or: [{ name: regex }, { email: regex }],
  }).select('_id').lean() as Array<{ _id: unknown }>

  const orConditions: FilterQuery<IChart>[] = [
    { name: regex },
    { birthPlace: regex },
  ]

  if (matchingUsers.length > 0) {
    orConditions.push({ userId: { $in: matchingUsers.map(u => u._id) } })
  }

  return { $or: orConditions }
}
