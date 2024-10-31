import { z } from "zod";

export const ConstituentUploadPresignPayloadSchema = z.object({
	filename: z.string(),
});
export interface ConstituentUploadPresignPayload
	extends z.infer<typeof ConstituentUploadPresignPayloadSchema> {}
