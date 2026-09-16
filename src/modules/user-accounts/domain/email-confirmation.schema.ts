import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
   _id: false,
})
export class EmailConfirmation {
   @Prop({ type: String, default: null })
   confirmationCode: string | null;

   @Prop({ type: Date, default: null })
   expirationDate: Date | null;

   @Prop({ type: Boolean, required: true, default: false })
   isConfirmed: boolean;
}

export const EmailConfirmationSchema =
   SchemaFactory.createForClass(EmailConfirmation);
