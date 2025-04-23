import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { Test } from './schemas/test.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class TestService {
  private readonly logger = new Logger(TestService.name);

  constructor(@InjectModel(Test.name) private testModel: Model<Test>) {}

  async create(createTestDto: CreateTestDto): Promise<Test> {
    const checkTestSlugExists = await this.testModel.exists({
      test_slug: createTestDto.test_slug,
    });
    if (checkTestSlugExists) {
      throw new BadRequestException('Test slug already exists');
    }
    const createdTest = await this.testModel.create(createTestDto);
    return createdTest as Test;
  }

  async findAll(): Promise<Test[]> {
    const tests = await this.testModel.find();
    return tests as Test[];
  }

  async findAllReadingTest(): Promise<Test[]> {
    const readingTests = await this.testModel.find({ type: 'reading' });
    return readingTests as Test[];
  }

  async findAllListeningTest(): Promise<Test[]> {
    const listeningTests = await this.testModel.find({ type: 'listening' });
    return listeningTests as Test[];
  }

  findOne(id: number) {
    return `This action returns a #${id} test`;
  }

  async getTestBySlug(slug: string): Promise<Test> {
    const test = await this.testModel.findOne({ test_slug: slug }).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test as Test;
  }

  async update(id: string, updateTestDto: UpdateTestDto): Promise<Test> {
    const test = await this.testModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const testToValidate = new this.testModel({
      ...test,
      ...updateTestDto,
    });

    const validationError = testToValidate.validateSync();
    if (validationError) {
      throw new BadRequestException(validationError.message);
    }

    try {
      Object.assign(test, updateTestDto);
      const updatedTest = await test.save();
      return updatedTest;
    } catch (error) {
      if (error.code === 11000) {
        this.logger.error(
          `Duplicate key error when updating test ${id}:`,
          error,
        );
        throw new BadRequestException('Duplicate data detected');
      }
      this.logger.error(`Error updating test with id ${id}:`, error.stack);
      throw new BadRequestException(
        'Failed to update test. Please try again later',
      );
    }
  }

  async remove(id: string) {
    const test = await this.testModel.findById(id).exec();
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    try {
      await this.testModel.deleteOne({ _id: id });
      return `Delete test with id: ${id} successfully`;
    } catch (error) {
      this.logger.error(`Error delete test with id ${id}:`, error.stack);
      throw new BadRequestException('Delete test failed');
    }
  }
}
