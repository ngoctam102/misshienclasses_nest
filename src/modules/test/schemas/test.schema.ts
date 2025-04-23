import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type ContentType = 'text' | 'image' | 'html';

@Schema()
class Content {
  @Prop({ required: true })
  type: ContentType;

  @Prop({ required: true })
  value: string; // text content, image URL, or raw HTML
}

const ContentSchema = SchemaFactory.createForClass(Content);

@Schema()
class Question {
  @Prop({ required: true })
  question_number: number;

  @Prop({
    required: true,
    enum: [
      'multiple-choice',
      'fill-in-blank',
      'matching',
      'true-false-not-given',
      'fill-in-blank-optional',
      'map',
      'correct-optional',
    ],
  })
  question_type: string;

  @Prop({ required: true })
  question_text: string;

  @Prop({ type: [String], default: [] })
  options?: string[]; // A, B, C, D

  @Prop({ type: [String], required: true })
  answer: string[];

  @Prop({ default: '' })
  explaination: string;
}

@Schema()
class QuestionGroup {
  @Prop()
  group_title: string;

  @Prop()
  group_instruction: string;

  @Prop({ type: ContentSchema })
  content?: Content;

  @Prop({ type: [String], default: [] })
  given_words?: string[]; // used for gap-fill

  @Prop({ type: [Question], default: [] })
  questions: Question[];
}

const QuestionGroupSchema = SchemaFactory.createForClass(QuestionGroup);

@Schema()
class Passage {
  @Prop({ required: true })
  passage_number: number;

  @Prop()
  title: string;

  @Prop({ type: ContentSchema })
  content?: Content;

  @Prop()
  audio_url?: string; // listening audio

  @Prop({ type: [QuestionGroupSchema], default: [] })
  question_groups: QuestionGroup[];
}

const PassageSchema = SchemaFactory.createForClass(Passage);

@Schema({ timestamps: true })
export class Test extends Document {
  @Prop({ required: true, unique: true })
  test_slug: string;

  @Prop({ required: true, enum: ['reading', 'listening'] })
  type: string;

  @Prop({ required: true, enum: ['academic', 'general'] })
  level: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ type: [PassageSchema], default: [] })
  passages: Passage[];
}

export const TestSchema = SchemaFactory.createForClass(Test);
