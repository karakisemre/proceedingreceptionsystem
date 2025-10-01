import { z } from 'zod'


export const degreeEnum = ['lisans','yuksek_lisans','doktora'] as const
export const presentationEnum = ['sozlu','poster'] as const


export const FormSchema = z.object({
degree: z.enum(degreeEnum),
full_name: z.string().min(3),
phone: z.string().optional(),
email: z.string().email(),
university: z.string().min(2),
title: z.string().min(5),
presentation: z.enum(presentationEnum),
keywords: z.array(z.string().min(1)).min(1).max(10),
summary: z.string().min(20).max(5000), // kelime sayısını ayrıca kontrol edeceğiz
file_name: z.string().min(3),
file_mime: z.string(),
file_size: z.number().int().positive(),
file_path: z.string().min(5)
})


export type FormDataDTO = z.infer<typeof FormSchema>