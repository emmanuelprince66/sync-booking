import { z } from 'zod'

export const blockTimeSchema = z.object({
  title: z.string().trim().min(1, 'Add a title, e.g. Personal appointment'),
  date: z.string().min(1, 'Choose a date'),
  startTime: z.string().min(1, 'Choose a start time'),
  endTime: z.string().min(1, 'Choose an end time'),
  note: z.string(),
}).refine(values => !values.startTime || !values.endTime || values.endTime > values.startTime, { path: ['endTime'], message: 'Must be after the start time' })
export type BlockTimeValues = z.infer<typeof blockTimeSchema>
