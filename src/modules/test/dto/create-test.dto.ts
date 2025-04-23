import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

type ContentType = 'text' | 'image' | 'html';

class Content {
  @IsEnum(['text', 'image', 'html'])
  type: ContentType;

  @IsString()
  @IsNotEmpty()
  value: string;
}

class Question {
  @IsNumber()
  question_number: number;

  @IsEnum([
    'multiple-choice',
    'fill-in-blank',
    'matching',
    'true-false-not-given',
    'fill-in-blank-optional',
    'map',
    'correct-optional',
  ])
  question_type: string;

  @IsString()
  @IsNotEmpty()
  question_text: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  answer: string[];

  @IsOptional()
  @IsString()
  explaination: string;
}

class QuestionGroup {
  @IsOptional()
  @IsString()
  group_title?: string;

  @IsOptional()
  @IsString()
  group_instruction?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Content)
  content?: Content;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  given_words?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Question)
  questions: Question[];
}

class Passage {
  @IsNumber()
  passage_number: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => Content)
  content?: Content;

  @IsOptional()
  @IsString()
  audio_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionGroup)
  question_groups: QuestionGroup[];
}

export class CreateTestDto {
  @IsString()
  @IsNotEmpty()
  test_slug: string;

  @IsEnum(['reading', 'listening'])
  type: string;

  @IsEnum(['academic', 'general'])
  level: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  duration: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Passage)
  passages: Passage[];
}
