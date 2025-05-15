import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Score extends Document {
  @Prop({
    required: true,
    message: 'tên không được để trống',
  })
  name: string;

  @Prop({
    required: true,
    message: 'email không được để trống',
  })
  email: string;

  @Prop({
    required: true,
    message: 'role không được để trống',
  })
  role: string;

  @Prop({
    required: true,
    message: 'tên bài kiểm tra không được để trống',
  })
  test_name: string;

  @Prop({
    required: true,
    message: 'loại bài kiểm tra không được để trống',
  })
  test_type: string;

  @Prop({
    required: true,
    message: 'điểm không được để trống',
  })
  score: number;

  @Prop({
    required: true,
    message: 'thời gian làm bài không được để trống',
  })
  duration: number;

  @Prop()
  submit_date: Date;
}

export const ScoreSchema = SchemaFactory.createForClass(Score);
