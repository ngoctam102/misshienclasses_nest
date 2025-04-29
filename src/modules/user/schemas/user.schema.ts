import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: false })
  isApproved: boolean;

  @Prop({ default: false })
  hasAttemptedLogin: boolean;

  @Prop({
    default: 'student',
    enum: ['student', 'admin', 'editor'],
  })
  role: string;

  @Prop()
  approvedAt: Date;

  @Prop()
  lastLoginAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
